import { type IPeerDiscovery, type Peer } from "@peer-ring/discovery";
import { PeerRing } from "../src/peer-ring";
import {
  type Command,
  PredefinedCommandsEnum,
  type InetManager,
  type PeerRingOpts,
} from "../src/types";
import pino from "pino";

jest.mock("nanoid", () => {
  return { nanoid: () => "1234" };
});

const mockPeerDiscovery: IPeerDiscovery = {
  getActivePeers: jest.fn(),
  onPeerAdded: jest.fn(),
  onPeerRemoved: jest.fn(),
  whoAmI: jest.fn(),
};

const mockNetManager: InetManager = {
  onMessage: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  setIp: jest.fn(),
  start: jest.fn(),
};

const logger = pino().child({ class: "PeerRing" });

describe("PeerRing", () => {
  let peerRing: PeerRing;
  let commandHandler: jest.Mock;
  const peer: Peer = { ip: "127.0.0.1", name: "name" };
  const me: Peer = { ip: "127.0.0.2", name: "name" };
  const others: Peer[] = [
    { ip: "127.0.0.3", name: "name" },
    { ip: "127.0.0.4", name: "name" },
    { ip: "127.0.0.5", name: "name" },
  ];
  const opts: PeerRingOpts = {
    peerDiscovery: mockPeerDiscovery,
    netManager: mockNetManager,
    logger,
    virtualNodes: 3,
  };
  // let getActivePeersSpy;
  // let whoAmISpy;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(mockPeerDiscovery, "getActivePeers")
      .mockResolvedValue([peer, me].concat(others));
    jest.spyOn(mockPeerDiscovery, "whoAmI").mockResolvedValue(me);
    commandHandler = jest.fn();

    peerRing = new PeerRing(opts);
    await peerRing.initRing();
    peerRing.registerCommand({
      namespace: "testNamespace",
      command: "testCommand",
      handler: commandHandler,
    });
  });

  describe("initRing", () => {
    it("should initialize with peers from discovery", async () => {
      const peerRing = new PeerRing(opts);
      expect(peerRing.nodes.length).toBe(0);
      await peerRing.initRing();
      expect(mockPeerDiscovery.getActivePeers).toHaveBeenCalledWith();
      expect(mockNetManager.setIp).toHaveBeenCalledWith(me.ip);
      expect(peerRing.nodes.length).toBe(20); // virtualNodes
    });
  });

  describe("registerCommand", () => {
    it("should register command handler", () => {
      expect(Object.values(peerRing.commands).length).toBe(1);
      peerRing.registerCommand({
        namespace: "testNamespace1",
        command: "testCommand",
        handler: commandHandler,
      });
      expect(Object.values(peerRing.commands).length).toBe(2);

      expect(Object.values(peerRing.commands)[0]).toBe(commandHandler);
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should execute command if current node is the owner", async () => {
      const command: Command = {
        namespace: "testNamespace",
        command: "testCommand",
        key: `${me.ip}:0`,
        payload: {},
      };
      await peerRing.execute(command);
      expect(commandHandler).toHaveBeenCalledWith(command.key, command.payload);
      expect(mockNetManager.sendMessage).not.toHaveBeenCalled();
    });

    it("should forward command to the correct node if current node is not the owner", async () => {
      const command: Command = {
        namespace: "testNamespace",
        command: "testCommand",
        key: `${peer.ip}:0`,
        payload: {},
      };
      await peerRing.execute(command);
      expect(mockNetManager.sendMessage).toHaveBeenCalledWith(peer.ip, command);
      expect(commandHandler).not.toHaveBeenCalled();
    });

    it("should handle predefined EmptyReply command", async () => {
      const command: Command = {
        namespace: "predefined",
        command: PredefinedCommandsEnum.EmptyReply,
        key: "testKey",
        payload: {},
      };
      const result = await peerRing.execute(command);
      expect(result).toBeUndefined();
      expect(commandHandler).not.toHaveBeenCalled();
      expect(mockNetManager.sendMessage).not.toHaveBeenCalled();
    });

    it("should execute command multiple different nodes when replicationFactor is set", async () => {
      const command: Command = {
        namespace: "testNamespace",
        command: "testCommand",
        key: `${peer.ip}:0`,
        payload: {},
        opts: { replicationFactor: 3 },
      };

      const result = await peerRing.execute(command);
      expect(result).toBeUndefined();
      expect(commandHandler).not.toHaveBeenCalled();
      expect(mockNetManager.sendMessage).toHaveBeenCalledTimes(3);
      expect(mockNetManager.sendMessage).toHaveBeenCalledWith(peer.ip, command);
      expect(mockNetManager.sendMessage).toHaveBeenCalledWith(
        "127.0.0.3",
        command,
      );
      expect(mockNetManager.sendMessage).toHaveBeenCalledWith(
        "127.0.0.4",
        command,
      );
    });
  });

  describe("onPeerAdded", () => {
    it("should add peer and allocate it on the ring", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      peerRing.onPeerAdded(newPeer);
      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(true);
    });
  });

  describe("onPeerRemoved", () => {
    it("should remove peer from the ring", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      peerRing.onPeerAdded(newPeer);
      peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer from the ring when no peer is present", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      const peerRing = new PeerRing(opts);
      peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer from the ring when peer is not present", async () => {
      const newPeer: Peer = {
        ip: "no_found",
      };
      peerRing.onPeerRemoved(newPeer);

      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer when only 1 peer is present", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      const peerRing = new PeerRing({ ...opts, virtualNodes: 0 });
      peerRing.onPeerAdded(newPeer);
      expect(peerRing.nodes.length).toBe(1);
      peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.length).toBe(0);
    });
  });
});
