import { type Command } from "@peer-ring/core";
import { Commands, namespace, type CacheItem } from "./types";

export class MemCache {
  private readonly cache = new Map<string, CacheItem>();

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

  async set(key: Command["key"], payload: CacheItem): Promise<undefined> {
    this.cache.set(
      key,
      this.buildCacheValue(payload.item, payload.updatedAt, payload.ttl),
    );
  }

  async delete(key: Command["key"], _: CacheItem): Promise<undefined> {
    this.cache.delete(key);
  }

  async get(
    key: Command["key"],
    _: CacheItem,
  ): Promise<Command<CacheItem> | undefined> {
    const val = this.cache.get(key);
    if (!val) return undefined;
    if (val?.ttl && !isNaN(val.ttl)) {
      if (new Date() > new Date(val.ttl)) {
        this.cache.delete(key);
        return undefined;
      }
    }
    return {
      key,
      namespace,
      payload: val,
      command: Commands.get,
    };
  }
}
