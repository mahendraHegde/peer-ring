import { RpcNetManager } from "../src/rpc/index";
import { type Command, type NetManagerOpts } from "../src/index";
import { type ClientDuplexStream } from "@grpc/grpc-js";
import { HashRingClient } from "../src/rpc/proto/hashring_grpc_pb";
import { StreamCommand, PeerPayload } from "../src/rpc/proto/hashring_pb";

jest.mock("nanoid", () => ({
  nanoid: jest.fn().mockReturnValue("mock-id"),
}));

describe("RpcNetManager", () => {
  const netManagerOpts: NetManagerOpts = { port: 1234, requestTimeout: 800 };
  let rpcNetManager: RpcNetManager;

  beforeEach(async () => {
    rpcNetManager = new RpcNetManager(netManagerOpts);
    await rpcNetManager.start();
  });
  afterEach(async () => {
    if (typeof rpcNetManager?.stop === "function") {
      await rpcNetManager.stop();
    }
  });

  describe("sendMessage", () => {
    it("should send request and wait for the response & handle incoming requests, reject when timeout happens", async () => {
      // this: void
      const executeCallback = jest.fn();
      const ip = "127.0.0.1";
      const command: Command = {
        command: "test",
        key: "key",
        namespace: "namespace",
        payload: {
          name: "test",
        },
      };

      const responseStreamCommand = new StreamCommand();
      responseStreamCommand.setCommand("cmd");
      responseStreamCommand.setKey("key");
      responseStreamCommand.setNamespace("ns");
      responseStreamCommand.setPayload(JSON.stringify(command.payload));
      const payload = new PeerPayload();
      payload.setCommand(responseStreamCommand);
      payload.setId("mock-id");
      let callback: (cmd: PeerPayload) => void = () => {};

      const mockStream: ClientDuplexStream<PeerPayload, PeerPayload> = {
        write: jest.fn().mockImplementation((_, cb) => cb()),
        destroyed: false,
        closed: false,
        writableNeedDrain: false,
        on: jest
          .fn()
          .mockImplementation((event: string, cb: typeof callback) => {
            if (event === "data") {
              callback = cb;
            }
          }),
        once: jest.fn(),
      } as unknown as ClientDuplexStream<PeerPayload, PeerPayload>;
      jest
        .spyOn(HashRingClient.prototype, "executeCommand")
        .mockReturnValue(mockStream);

      rpcNetManager.onMessage(executeCallback);
      const promise = rpcNetManager.makeRequest(ip, command);
      await new Promise((resolve) =>
        process.nextTick(() => {
          callback(payload);
          resolve(payload);
        }),
      );
      await expect(promise).resolves.toMatchObject(
        expect.objectContaining({
          command: "cmd",
          key: "key",
          namespace: "ns",
          payload: command.payload,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockStream.write).toHaveBeenCalled();
      expect(executeCallback).not.toHaveBeenCalled();

      // new request flow
      callback(payload);
      expect(executeCallback).toHaveBeenCalledWith({
        command: "cmd",
        key: "key",
        namespace: "ns",
        payload: {
          name: "test",
        },
      });

      //reject timedouts
      const promiseTimedOut = rpcNetManager.makeRequest(ip, command);
      await expect(promiseTimedOut).rejects.toEqual({
        code: "10",
        message: "Request did not finish within 800ms",
      });
    });
  });

  describe("onMessage", () => {
    it("should set the callback correctly", () => {
      const callback = jest.fn();
      rpcNetManager.onMessage(callback);
      expect(rpcNetManager.executeCallback).toBe(callback);
    });
  });

  describe("setIp", () => {
    it("should set the IP address correctly", () => {
      const ip = "127.0.0.1";
      rpcNetManager.setIp(ip);
      expect(rpcNetManager.ip).toBe(ip);
    });
  });

  describe("stop", () => {
    beforeEach(async () => {
      if (typeof rpcNetManager?.stop === "function") {
        await rpcNetManager.stop();
      }
    });
    it("should gracefully shut down the server", async () => {
      const mockTryShutdown = jest.fn((callback: (err?: Error) => void) => {
        callback();
      });
      rpcNetManager.server.tryShutdown = mockTryShutdown;

      await expect(rpcNetManager.stop()).resolves.toBeUndefined();
      expect(mockTryShutdown).toHaveBeenCalled();
    });
  });
});
