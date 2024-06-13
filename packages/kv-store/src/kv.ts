import { K8sPeerDiscovery } from "@peer-ring/discovery-k8s";
import {
  type CommandHandler,
  PeerRing,
  buildLogger,
  type PeerRingOpts,
  ExecuteOpts,
} from "@peer-ring/core";
import { type IPeerDiscovery } from "@peer-ring/discovery";
import {
  type CacheItem,
  Commands,
  KVEvents,
  type KVOpts,
  namespace,
} from "./types";
import { type Logger } from "pino";
import { EventEmitter } from "node:events";
import { MemCache } from "./memcache";

export class KVStore {
  private readonly peerRing: PeerRing;
  private isReady: boolean;
  private isInitRunning: boolean;
  private startupError: Error;
  private readonly logger: Logger;
  private readonly eventEmitter: EventEmitter;
  private readonly memCache: MemCache;
  constructor(opts: KVOpts = {}) {
    let discovery: PeerRingOpts["peerDiscovery"];
    this.logger = buildLogger(opts.logger).child({ class: KVStore.name });
    if (!opts.peerRingOpts?.peerDiscovery) {
      discovery = new K8sPeerDiscovery({ logger: this.logger });
    } else if (
      "watchQueryParams" in opts.peerRingOpts?.peerDiscovery ||
      "kubeConfig" in opts.peerRingOpts?.peerDiscovery
    ) {
      discovery = new K8sPeerDiscovery({
        ...opts.peerRingOpts?.peerDiscovery,
        logger: this.logger,
      });
    } else {
      discovery = opts.peerRingOpts?.peerDiscovery as IPeerDiscovery;
    }

    this.peerRing = new PeerRing({
      ...opts.peerRingOpts,
      peerDiscovery: discovery,
      logger: this.logger,
    });
    this.eventEmitter = new EventEmitter();
    this.memCache = new MemCache();
    this._initCache().catch((err) => {
      this.logger.error({ err }, `Failed to init the KV store`);
      this.startupError = err;
    });
  }

  private async _initCache(): Promise<void> {
    this.isInitRunning = true;
    await this.peerRing.initRing();
    [
      {
        namespace,
        command: Commands.set,
        handler: this.memCache.set.bind(this.memCache) as CommandHandler,
      },
      {
        namespace,
        command: Commands.get,
        handler: this.memCache.get.bind(this.memCache) as CommandHandler,
      },
      {
        namespace,
        command: Commands.delete,
        handler: this.memCache.delete.bind(this.memCache),
      },
    ].forEach((cmd) => {
      this.peerRing.registerCommand(cmd);
    });
    this.isReady = true;
    this.isInitRunning = false;
    this.eventEmitter.emit(KVEvents.up);
    this.logger.debug("KV init success");
  }

  private async waitForUp(): Promise<void> {
    if (this.startupError) {
      throw this.startupError;
    }
    if (!this.isReady) {
      return new Promise((resolve) => {
        this.eventEmitter.once(KVEvents.up, () => {
          resolve();
        });
      });
    }
  }

  async init(): Promise<void> {
    if (this.isReady) {
      return;
    }
    if (this.isInitRunning) {
      return this.waitForUp();
    }
    await this._initCache();
  }

  async stop(): Promise<void> {
    await this.peerRing.stop();
  }

  async set<T>(
    key: string,
    item: T,
    { ttl, ...executeOpts }: { ttl?: number | undefined } & ExecuteOpts = {},
  ): Promise<void> {
    await this.waitForUp();
    if (item === undefined) {
      return;
    }
    const payload: CacheItem = {
      item: JSON.stringify(item),
      ttl,
      updatedAt: new Date().getTime(),
    };
    this.logger.debug({ key, item, ttl }, "sending SET to peer ring");
    await this.peerRing.execute({
      namespace,
      command: Commands.set,
      key,
      payload,
      opts: executeOpts,
    });
  }

  async get<T>(key: string, opts: ExecuteOpts = {}): Promise<T | undefined> {
    await this.waitForUp();
    this.logger.debug({ key }, "sending GET to peer ring");
    const command = await this.peerRing.execute<CacheItem>({
      namespace,
      command: Commands.get,
      key,
      opts,
    });
    if (!command) {
      return undefined;
    }
    return command.payload?.item
      ? JSON.parse(command.payload?.item)
      : undefined;
  }

  async delete(key: string, opts: ExecuteOpts = {}): Promise<undefined> {
    await this.waitForUp();
    await this.peerRing.execute({
      namespace,
      command: Commands.delete,
      key,
      opts,
    });
  }
}
