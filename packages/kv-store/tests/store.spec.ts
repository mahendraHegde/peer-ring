import { Store } from "../src/store";
import { Command, PeerRing } from "@peer-ring/core";
import { CacheItem, Commands, namespace } from "../src/types";

describe("Store", () => {
  let store: Store;
  let mockPeerRing: PeerRing;

  beforeEach(() => {
    mockPeerRing = {} as PeerRing;
    mockPeerRing.updateKeysMeta = jest.fn();
    store = new Store(mockPeerRing, true, true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("set", () => {
    it("should set a valid cache item", async () => {
      const command = {
        key: "testKey",
        payload: { item: "testItem", updatedAt: Date.now(), ttl: undefined },
      } as Command<CacheItem>;
      await store.set(command);

      expect(store["cache"].get(command.key)).toEqual({
        item: "testItem",
        ttl: undefined,
        updatedAt: command?.payload?.updatedAt,
      });
      expect(mockPeerRing.updateKeysMeta).toHaveBeenCalledWith(
        [command.key],
        "set",
      );
    });

    it("should not set an expired cache item", async () => {
      const command = {
        key: "testKey",
        payload: {
          item: "testItem",
          updatedAt: Date.now() - 1000,
          ttl: Date.now() - 500,
        },
      } as Command<CacheItem>;
      await store.set(command);

      expect(store["cache"].get(command.key)).toBeUndefined();
    });

    it("should handle delayed requests", async () => {
      const command1 = {
        key: "testKey",
        payload: { item: "testItem", updatedAt: Date.now() },
      } as Command<CacheItem>;
      const command2 = {
        key: "testKey",
        payload: { item: "newItem", updatedAt: Date.now() - 1000 },
      } as Command<CacheItem>;
      await store.set(command1);
      await store.set(command2);

      expect(store["cache"].get(command1.key)).toEqual({
        item: "testItem",
        ttl: undefined,
        updatedAt: command1?.payload?.updatedAt,
      });
    });
  });

  describe("delete", () => {
    it("should delete an existing item", async () => {
      const command = {
        key: "testKey",
        payload: { item: "testItem", updatedAt: Date.now() },
      } as Command<CacheItem>;
      await store.set(command);
      await store.delete(command, true);

      expect(store["cache"].get(command.key)).toBeUndefined();
      expect(mockPeerRing.updateKeysMeta).toHaveBeenCalledWith(
        [command.key],
        "delete",
      );
    });

    it("should set a tombstone for deleted item if tombstoneDeleted is true", async () => {
      const command = {
        key: "testKey",
        payload: { item: "testItem", updatedAt: Date.now() },
      } as Command<CacheItem>;
      await store.set(command);
      await store.delete(command, false);

      expect(store["cache"].get(command.key)).toEqual({
        item: "",
        updatedAt: expect.any(Number),
        ttl: undefined,
      });
      expect(mockPeerRing.updateKeysMeta).toHaveBeenCalledWith(
        [command.key],
        "delete",
      );
    });
  });

  describe("get", () => {
    it("should return a cached item", async () => {
      const command = {
        key: "testKey",
        payload: { item: "testItem", updatedAt: Date.now() },
      } as Command<CacheItem>;
      await store.set(command);
      const result = await store.get({
        key: "testKey",
        namespace: "testNamespace",
        command: Commands.get,
      });

      expect(result).toEqual({
        key: "testKey",
        namespace,
        payload: {
          item: "testItem",
          ttl: undefined,
          updatedAt: command?.payload?.updatedAt,
        },
        command: Commands.get,
      });
    });

    it("should return undefined for an expired item", async () => {
      const command = {
        key: "testKey",
        payload: {
          item: "testItem",
          updatedAt: Date.now() - 1000,
          ttl: Date.now() - 500,
        },
      } as Command<CacheItem>;
      await store.set(command);
      const result = await store.get({
        key: "testKey",
        namespace: "testNamespace",
        command: Commands.get,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("mget", () => {
    it("should return multiple cached items", async () => {
      const commands = [
        { key: "key1", payload: { item: "item1", updatedAt: Date.now() } },
        { key: "key2", payload: { item: "item2", updatedAt: Date.now() } },
      ] as Array<Command<CacheItem>>;
      await Promise.all(commands.map((command) => store.set(command)));

      const result = await store.mget({
        key: "multiGetKey",
        payload: { keys: ["key1", "key2"] },
        namespace: "testNamespace",
        command: Commands.mget,
      });

      expect(result).toEqual({
        key: "multiGetKey",
        namespace,
        command: Commands.mget,
        payload: {
          data: [
            { key: "key1", item: commands[0].payload },
            { key: "key2", item: commands[1].payload },
          ],
        },
      });
    });

    it("should skip expired items in mget", async () => {
      const commands = [
        {
          key: "key1",
          payload: {
            item: "item1",
            updatedAt: Date.now() - 1000,
            ttl: Date.now() - 500,
          },
        },
        { key: "key2", payload: { item: "item2", updatedAt: Date.now() } },
      ] as Array<Command<CacheItem>>;
      await Promise.all(commands.map((command) => store.set(command)));

      const result = await store.mget({
        key: "multiGetKey",
        payload: { keys: ["key1", "key2"] },
        namespace: "testNamespace",
        command: Commands.mget,
      });

      expect(result).toEqual({
        key: "multiGetKey",
        namespace,
        command: Commands.mget,
        payload: {
          data: [{ key: "key2", item: commands[1].payload }],
        },
      });
    });
  });

  describe("mset", () => {
    it("should set multiple items", async () => {
      const command = {
        key: "multiSetKey",
        namespace,
        command: Commands.mset,
        payload: {
          data: [
            { key: "key1", item: { item: "item1", updatedAt: Date.now() } },
            { key: "key2", item: { item: "item2", updatedAt: Date.now() } },
          ],
        },
      };

      await store.mset(command);

      expect(store["cache"].get("key1")).toEqual({
        item: "item1",
        ttl: undefined,
        updatedAt: expect.any(Number),
      });
      expect(store["cache"].get("key2")).toEqual({
        item: "item2",
        ttl: undefined,
        updatedAt: expect.any(Number),
      });
    });
  });

  describe("mdel", () => {
    it("should delete multiple items", async () => {
      const commands = [
        { key: "key1", payload: { item: "item1", updatedAt: Date.now() } },
        { key: "key2", payload: { item: "item2", updatedAt: Date.now() } },
      ] as Array<Command<CacheItem>>;
      await Promise.all(commands.map((command) => store.set(command)));

      const command = {
        key: "multiDeleteKey",
        payload: { keys: ["key1", "key2"] },
        namespace: "testNamespace",
        command: Commands.mdel,
      };
      await store.mdel(command);

      expect(store["cache"].get("key1")).toBeUndefined();
      expect(store["cache"].get("key2")).toBeUndefined();
    });
  });
});
