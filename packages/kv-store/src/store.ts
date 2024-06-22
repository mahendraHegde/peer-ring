import { PeerRing, type Command } from "@peer-ring/core";
import { Commands, namespace, type CacheItem } from "./types";

export class Store {
  private readonly cache = new Map<string, CacheItem>();
  constructor(
    private readonly peerRing: PeerRing,
    private readonly updatePeerRingMeta?: boolean,
    private readonly tombstoneDeleted?: boolean,
  ) {}

  private buildCacheValue(
    val: string,
    updatedAt: number,
    ttl?: number,
  ): CacheItem {
    const v: CacheItem = {
      item: val,
      ttl,
      updatedAt,
    };
    if (ttl !== undefined && !isNaN(ttl)) {
      const date = new Date();
      date.setMilliseconds(date.getMilliseconds() + ttl);
      v.ttl = date.getTime();
    }
    return v;
  }

  private isAlreadyExpired(val?: CacheItem): boolean {
    if (val?.ttl && !isNaN(val.ttl)) {
      if (new Date() > new Date(val.ttl)) {
        return true;
      }
    }
    return false;
  }

  private isDelayedRequest(newVal: CacheItem, currentVal?: CacheItem): boolean {
    if (!currentVal) return false;
    return currentVal.updatedAt > newVal.updatedAt;
  }

  async set(command: Command<CacheItem>): Promise<undefined> {
    const { key, payload } = command;
    if (this.isAlreadyExpired(payload)) {
      return;
    }
    if (!payload) {
      this.delete(command);
      return;
    }
    const val = this.cache.get(key);
    if (this.isDelayedRequest(payload, val)) {
      return;
    }
    this.cache.set(
      key,
      this.buildCacheValue(payload.item, payload.updatedAt, payload.ttl),
    );
    if (this.updatePeerRingMeta) this.peerRing.updateKeysMeta([key], "set");
  }

  async delete(
    command: Command,
    disableTombstone?: boolean,
  ): Promise<undefined> {
    const { key } = command;
    const exisitng = await this.get(command);
    if (exisitng) {
      if (this.tombstoneDeleted && !disableTombstone) {
        //@TODO have a garbage collector for deleted items
        const val: CacheItem = {
          ...exisitng,
          item: "", //tombstone deleted data
          updatedAt: Date.now(),
        };
        this.set({ ...command, payload: val } as Command<CacheItem>);
      } else {
        this.cache.delete(key);
      }
      if (this.updatePeerRingMeta)
        this.peerRing.updateKeysMeta([key], "delete");
    }
  }

  async get(command: Command): Promise<Command<CacheItem> | undefined> {
    const { key } = command;
    const val = this.cache.get(key);
    if (!val) return undefined;
    if (this.isAlreadyExpired(val)) {
      this.cache.delete(key);
      return undefined;
    }
    return {
      key,
      namespace,
      payload: val,
      command: Commands.get,
    };
  }

  async mget(
    command: Command<{ keys: string[] }>,
  ): Promise<
    Command<{ data: { key: string; item: CacheItem }[] }> | undefined
  > {
    const { payload } = command;
    if (!payload?.keys?.length) return;
    const data: { key; item: CacheItem }[] = [];
    for (const key of payload.keys) {
      const res = await this.get({ key, namespace, command: Commands.get });
      if (res?.payload) {
        data.push({ key, item: res.payload });
      }
    }
    return {
      key: command.key,
      command: command.command,
      namespace,
      payload: {
        data,
      },
    };
  }

  async mset(
    command: Command<{ data: { key: string; item: CacheItem }[] }>,
  ): Promise<undefined> {
    if (!command?.payload?.data?.length) return undefined;
    for (const data of command?.payload?.data) {
      await this.set({
        namespace,
        command: Commands.set,
        key: data.key,
        payload: data.item,
      });
    }
  }

  async mdel(command: Command<{ keys: string[] }>): Promise<undefined> {
    if (!command.payload?.keys?.length) return;
    for (const key of command.payload.keys) {
      await this.delete({ namespace, command: Commands.delete, key }, true);
    }
  }
}
