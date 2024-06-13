import { RpcNetManager } from "../src/rpc/index";
import { type Command, type NetManagerOpts } from "../src/index";
import { type ClientDuplexStream } from "@grpc/grpc-js";
import { HashRingClient } from "../src/rpc/proto/hashring_grpc_pb";
import { StreamCommand } from "../src/rpc/proto/hashring_pb";

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
      responseStreamCommand.setId("mock-id");
      responseStreamCommand.setPayload(JSON.stringify(command.payload));
      let callback: (cmd: StreamCommand) => void = () => {};

      const mockStream: ClientDuplexStream<StreamCommand, StreamCommand> = {
        write: jest.fn(),
        destroyed: false,
        closed: false,
        on: jest
          .fn()
          .mockImplementation((event: string, cb: typeof callback) => {
            if (event === "data") {
              callback = cb;
            }
          }),
      } as unknown as ClientDuplexStream<StreamCommand, StreamCommand>;
      jest
        .spyOn(HashRingClient.prototype, "executeCommand")
        .mockReturnValue(mockStream);

      rpcNetManager.onMessage(executeCallback);
      const promise = rpcNetManager.sendMessage(ip, command);
      callback(responseStreamCommand);
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
      callback(responseStreamCommand);
      expect(executeCallback).toHaveBeenCalledWith({
        command: "cmd",
        key: "key",
        namespace: "ns",
        payload: {
          name: "test",
        },
      });

      //reject timedouts
      const promiseTimedOut = rpcNetManager.sendMessage(ip, command);
      await expect(promiseTimedOut).rejects.toEqual({
        code: 10,
        details: "Request did not finish within 800ms",
        message: "Request did not finish within 800ms",
        metadata: expect.anything(),
        name: "TimedOut",
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
