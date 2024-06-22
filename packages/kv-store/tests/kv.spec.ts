import { KVStore } from "../src/kv";
import * as PeerRingCore from "@peer-ring/core";
import { type CacheItem, Commands, namespace } from "../src/types";
import { pino } from "pino";

const mockExecute = jest
  .fn()
  .mockImplementation((command: PeerRingCore.Command) => {
    if (command.key === "test") {
      return Promise.resolve({
        payload: {
          item: JSON.stringify("testValue"),
          updatedAt: Date.now(),
        },
      });
    } else if (command.key === "multi") {
      return Promise.resolve({
        payload: {
          item: JSON.stringify("test1"),
          updatedAt: new Date("01-01-2000").getTime(),
        },
        context: {
          peerResponses: {
            results: [
              {
                payload: {
                  item: JSON.stringify("old"),
                  updatedAt: new Date("01-01-2001").getTime(),
                },
              },
              {
                payload: {
                  item: JSON.stringify("multi"),
                  updatedAt: Date.now(),
                },
              },
            ],
          },
        },
      });
    }
  });
const mockRegisterCommand = jest.fn();
const mockInitRing = jest.fn();
const mockStop = jest.fn();
const logger = {} as pino.Logger;
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();
logger.child = jest.fn().mockReturnValue(logger);
jest.mock("@peer-ring/core", () => {
  return {
    ...jest.requireActual("@peer-ring/core"),
    PeerRing: jest.fn().mockImplementation(() => {
      return {
        registerCommand: mockRegisterCommand,
        initRing: mockInitRing,
        execute: mockExecute,
        stop: mockStop,
      };
    }),
    buildLogger: jest.fn().mockImplementation(() => logger),
  };
});

describe("KVStore", () => {
  let kvStore: KVStore;
  beforeEach(() => {
    kvStore = new KVStore({
      peerRingOpts: {
        peerDiscovery: {},
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("init", () => {
    it("should initialize the cache and set isReady to true", async () => {
      await kvStore.init();
      expect(mockInitRing).toHaveBeenCalled();
      expect(mockRegisterCommand).toHaveBeenCalledTimes(3);
    });
  });

  describe("stop", () => {
    it("should stop the peerRing", async () => {
      await kvStore.stop();

      expect(mockStop).toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should set a value in the store", async () => {
      await kvStore.set("testKey", "testValue", { ttl: 1000 });

      expect(mockExecute).toHaveBeenCalledWith({
        namespace,
        command: Commands.set,
        key: "testKey",
        payload: expect.objectContaining({
          item: JSON.stringify("testValue"),
          ttl: 1000,
          updatedAt: expect.any(Number),
        }),
        opts: {},
      });
    });

    it("should not set undefined values", async () => {
      await kvStore.set("testKey", undefined);

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should get a value from the store", async () => {
      const cacheItem: CacheItem = {
        item: JSON.stringify("testValue"),
        updatedAt: Date.now(),
      };
      const result = await kvStore.get<string>("test");
      expect(mockExecute).toHaveBeenCalledWith({
        namespace,
        command: Commands.get,
        key: "test",
        opts: {},
      });

      expect(result).toBe("testValue");
    });

    it("should return undefined for non-existent keys", async () => {
      const result = await kvStore.get<string>("testKey");
      expect(mockExecute).toHaveBeenCalledWith({
        namespace,
        command: Commands.get,
        key: "testKey",
        opts: {},
      });
      expect(result).toBeUndefined();
    });

    it("should reconciliate for multiple responses", async () => {
      const result = await kvStore.get<string>("multi");
      expect(mockExecute).toHaveBeenCalledWith({
        namespace,
        command: Commands.get,
        key: "multi",
        opts: {},
      });
      expect(result).toEqual("multi");
    });
  });

  describe("delete", () => {
    it("should delete a value from the store", async () => {
      await kvStore.delete("testKey");

      expect(mockExecute).toHaveBeenCalledWith({
        namespace,
        command: Commands.delete,
        key: "testKey",
        opts: {},
      });
    });
  });
});
