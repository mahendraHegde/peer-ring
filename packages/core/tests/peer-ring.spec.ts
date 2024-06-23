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
  makeRequest: jest.fn().mockResolvedValue(undefined),
  setIp: jest.fn(),
  start: jest.fn(),
  onMessageStream: jest.fn(),
  getDataStream: jest.fn().mockImplementation(async function* () {
    yield { key: 1, payload: 1 };
  }),
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
    { ip: "10.0.1.5", name: "name" },
  ];
  const opts: PeerRingOpts = {
    peerDiscovery: mockPeerDiscovery,
    netManager: mockNetManager,
    logger,
    virtualNodes: 3,
    initiateDataStealDelay: 0,
    newPeerCoolDownDelay: 0,
  };
  // let getActivePeersSpy;
  // let whoAmISpy;
  commandHandler = jest.fn();
  const commands = [
    {
      namespace: "testNamespace",
      command: "testCommand",
      handler: commandHandler,
    },
    {
      namespace: "testNamespace",
      command: PredefinedCommandsEnum.MGet,
      handler: commandHandler,
    },
    {
      namespace: "testNamespace",
      command: PredefinedCommandsEnum.MSet,
      handler: commandHandler,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    jest
      .spyOn(mockPeerDiscovery, "getActivePeers")
      .mockResolvedValue([peer, me].concat(others));
    jest.spyOn(mockPeerDiscovery, "whoAmI").mockResolvedValue(me);

    peerRing = new PeerRing(opts);
    await peerRing.initRing();
    commands.forEach((cmd) => {
      peerRing.registerCommand(cmd);
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

  describe("initiateTransfer", () => {
    /**
       *  [
    {
      "ip": "127.0.0.1",
      "pos": 344330664,
      "token": 1
    },
    {
      "ip": "10.0.1.5",
      "pos": 729126737,
      "token": 2
    },
    {
      "ip": "127.0.0.3", //me
      "pos": 1019338712,
      "token": 3
    },
    {
      "ip": "127.0.0.2",
      "pos": 3167026147,
      "token": 8
    },
    {
      "ip": "127.0.0.4",
      "pos": 3572855204,
      "token": 9
    }
  ]
       */

    let peerRing: PeerRing;
    beforeEach(async () => {
      jest.clearAllMocks();
      jest.spyOn(mockPeerDiscovery, "whoAmI").mockResolvedValueOnce(others[0]);
      peerRing = new PeerRing({
        ...opts,
        tokens: 10,
        virtualNodes: 0,
      });
      commands.forEach((cmd) => {
        peerRing.registerCommand(cmd);
      });
      await peerRing.initRing();
    });
    it("should steal tokens from its peers on startup", async () => {
      expect(mockNetManager.getDataStream).toHaveBeenCalledWith("10.0.1.5", {
        command: PredefinedCommandsEnum.MoveData,
        key: PredefinedCommandsEnum.MoveData,
        namespace: "testNamespace",
        payload: { tokens: [3, 4, 5, 6, 7] },
      });
    });
    it("should copy tokens from its peers on token redestribution because of peer down", async () => {
      await await peerRing.onPeerRemoved({ ip: "127.0.0.2" });
      expect(mockNetManager.getDataStream).toHaveBeenCalledWith("127.0.0.4", {
        command: PredefinedCommandsEnum.CopyData,
        key: PredefinedCommandsEnum.CopyData,
        namespace: "testNamespace",
        payload: { tokens: [8] },
      });

      await await peerRing.onPeerRemoved({ ip: "127.0.0.4" });
      expect(mockNetManager.getDataStream).toHaveBeenCalledWith("127.0.0.1", {
        command: PredefinedCommandsEnum.CopyData,
        key: PredefinedCommandsEnum.CopyData,
        namespace: "testNamespace",
        payload: { tokens: [9, 10] },
      });

      await await peerRing.onPeerRemoved({ ip: "127.0.0.1" });
      expect(mockNetManager.getDataStream).toHaveBeenCalledWith("10.0.1.5", {
        command: PredefinedCommandsEnum.CopyData,
        key: PredefinedCommandsEnum.CopyData,
        namespace: "testNamespace",
        payload: { tokens: [1] },
      });
      jest.clearAllMocks();
      await await peerRing.onPeerRemoved({ ip: "10.0.1.5" });
      expect(mockNetManager.getDataStream).not.toHaveBeenCalled();
    });
    it("should ignore copy tokens from its peers if node went down is not its next node", async () => {
      jest.clearAllMocks();
      await await peerRing.onPeerRemoved({ ip: "127.0.0.1" });
      expect(mockNetManager.getDataStream).not.toHaveBeenCalled();
    });
  });

  describe("registerCommand", () => {
    it("should register command handler", () => {
      expect(Object.values(peerRing.commands).length).toBe(3);
      peerRing.registerCommand({
        namespace: "testNamespace1",
        command: "testCommand",
        handler: commandHandler,
      });
      expect(Object.values(peerRing.commands).length).toBe(4);

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
      expect(commandHandler).toHaveBeenCalledWith(command);
      expect(mockNetManager.makeRequest).not.toHaveBeenCalled();
    });

    it("should forward command to the correct node if current node is not the owner", async () => {
      const command: Command = {
        namespace: "testNamespace",
        command: "testCommand",
        key: `${peer.ip}:0`,
        payload: {},
      };
      await peerRing.execute(command);
      expect(mockNetManager.makeRequest).toHaveBeenCalledWith(peer.ip, command);
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
      expect(mockNetManager.makeRequest).not.toHaveBeenCalled();
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
      expect(mockNetManager.makeRequest).toHaveBeenCalledTimes(3);
      expect(mockNetManager.makeRequest).toHaveBeenCalledWith(peer.ip, command);
      expect(mockNetManager.makeRequest).toHaveBeenCalledWith(
        "127.0.0.3",
        command,
      );
      expect(mockNetManager.makeRequest).toHaveBeenCalledWith(
        "10.0.1.5",
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
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should remove peer from the ring", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      peerRing.onPeerAdded(newPeer);
      await peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer from the ring when no peer is present", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      const peerRing = new PeerRing(opts);
      await peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer from the ring when peer is not present", async () => {
      const newPeer: Peer = {
        ip: "no_found",
      };
      await peerRing.onPeerRemoved(newPeer);

      expect(peerRing.nodes.some((node) => node.ip === newPeer.ip)).toBe(false);
    });
    it("should handle remove peer when only 1 peer is present", async () => {
      const newPeer: Peer = {
        ip: "127.0.0.100",
      };
      const peerRing = new PeerRing({ ...opts, virtualNodes: 0 });
      peerRing.onPeerAdded(newPeer);
      expect(peerRing.nodes.length).toBe(1);
      await peerRing.onPeerRemoved(newPeer);
      expect(peerRing.nodes.length).toBe(0);
    });
    describe("remaining nodes should redistribute tokens owned by the peer went down", () => {
      const nodes = [
        {
          ip: "10.42.1.13",
          name: "kv-app-7cc7cfdc9-fn7mt",
        },
        {
          ip: "10.42.0.11",
          name: "kv-app-7cc7cfdc9-pgrg4",
        },
        {
          ip: "10.42.2.10",
          name: "kv-app-7cc7cfdc9-jjmh9",
        },
      ];
      /** 
 * 
 * [
    {
      "ip": "10.42.0.11",
      "name": "kv-app-7cc7cfdc9-pgrg4",
      "pos": 2806135051,
      "isVirtual": false,
      "addedAt": 1718934533860,
      "token": 66
    },
    {
      "ip": "10.42.1.13",
      "name": "kv-app-7cc7cfdc9-fn7mt",
      "pos": 2975545427,
      "isVirtual": true,
      "addedAt": 1718934533860,
      "token": 70
    },
    {
      "ip": "10.42.2.10",
      "name": "kv-app-7cc7cfdc9-jjmh9",
      "pos": 3189257191,
      "isVirtual": false,
      "addedAt": 1718934533860,
      "token": 75
    },
    {
      "ip": "10.42.0.11",
      "name": "kv-app-7cc7cfdc9-pgrg4",
      "pos": 3228316892,
      "isVirtual": true,
      "addedAt": 1718934533860,
      "token": 76
    },
    {
      "ip": "10.42.2.10",
      "name": "kv-app-7cc7cfdc9-jjmh9",
      "pos": 3521019418,
      "isVirtual": true,
      "addedAt": 1718934533860,
      "token": 82
    },
    {
      "ip": "10.42.1.13",
      "name": "kv-app-7cc7cfdc9-fn7mt",
      "pos": 4287935761,
      "isVirtual": false,
      "addedAt": 1718934533860,
      "token": 100
    }
  ]
 * 
 * 
*/
      it("should intiate data copy when current node owns some tokens", async () => {
        jest.spyOn(mockPeerDiscovery, "whoAmI").mockResolvedValueOnce(nodes[0]);
        jest
          .spyOn(mockPeerDiscovery, "getActivePeers")
          .mockResolvedValueOnce(nodes);
        const peerRing = new PeerRing({
          ...opts,
          virtualNodes: 1,
          tokens: 100,
        });
        commands.forEach((cmd) => {
          peerRing.registerCommand(cmd);
        });
        await peerRing.initRing();
        jest.clearAllMocks();

        await peerRing.onPeerRemoved({
          ip: "10.42.2.10",
          name: "kv-app-7cc7cfdc9-jjmh9",
        });
        expect(mockNetManager.getDataStream).toHaveBeenCalledTimes(1);
        expect(mockNetManager.getDataStream).toHaveBeenCalledWith(
          "10.42.0.11",
          {
            command: "PeerRing_CopyData",
            key: "PeerRing_CopyData",
            namespace: "testNamespace",
            payload: {
              tokens: [75],
            },
          },
        );
        expect(commandHandler).toHaveBeenCalledWith({ key: 1, payload: 1 });
      });
      it("should intiate data copy when other node owns some tokens", async () => {
        jest.spyOn(mockPeerDiscovery, "whoAmI").mockResolvedValueOnce(nodes[1]);
        jest
          .spyOn(mockPeerDiscovery, "getActivePeers")
          .mockResolvedValueOnce(nodes);
        const peerRing = new PeerRing({
          ...opts,
          virtualNodes: 1,
          tokens: 100,
        });
        commands.forEach((cmd) => {
          peerRing.registerCommand(cmd);
        });
        await peerRing.initRing();
        jest.clearAllMocks();

        await peerRing.onPeerRemoved({
          ip: "10.42.2.10",
          name: "kv-app-7cc7cfdc9-jjmh9",
        });
        expect(mockNetManager.getDataStream).toHaveBeenCalledTimes(1);
        expect(mockNetManager.getDataStream).toHaveBeenCalledWith(
          "10.42.1.13",
          {
            command: "PeerRing_CopyData",
            key: "PeerRing_CopyData",
            namespace: "testNamespace",
            payload: {
              tokens: Array.from({ length: 99 - 82 + 1 }, (_, i) => i + 82), //82-99
            },
          },
        );
        expect(commandHandler).toHaveBeenCalledWith({ key: 1, payload: 1 });
      });
    });
  });

  describe("executeStream", () => {
    const commandHandler = jest.fn().mockImplementation(({ payload }) => {
      return payload;
    });
    let peerRing: PeerRing;
    beforeEach(async () => {
      jest.clearAllMocks();
      peerRing = new PeerRing({
        ...opts,
        tokens: 5,
        virtualNodes: 0,
      });
      peerRing.registerCommand({
        namespace: "testNamespace",
        command: PredefinedCommandsEnum.MGet,
        handler: commandHandler,
      });
      peerRing.updateKeysMeta(["1", "2", "3"], "set");
      await peerRing.initRing();
    });
    it("should execute stream and return stream of data for available keys", async () => {
      const command: Command<{ tokens: number[] }> = {
        namespace: "testNamespace",
        command: PredefinedCommandsEnum.MoveData,
        key: "1",
        payload: {
          tokens: [1, 2, 3],
        },
      };
      const res: Command[] = [];
      for await (const data of peerRing.executeStream(command)) {
        res.push(data);
      }
      expect(res).toEqual([{ keys: ["2", "3"] }, { keys: ["1"] }]);
    });
  });
});
