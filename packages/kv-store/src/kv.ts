import { K8sPeerDiscovery } from "@peer-ring/discovery-k8s";
import {
  type CommandHandler,
  PeerRing,
  buildLogger,
  type PeerRingOpts,
  ExecuteOpts,
  PredefinedCommandsEnum,
  type Command,
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
import { Store } from "./store";

export class KVStore {
  private readonly peerRing: PeerRing;
  private isReady: boolean;
  private isInitRunning: boolean;
  private startupError: Error;
  private readonly logger: Logger;
  private readonly eventEmitter: EventEmitter;
  private readonly store: Store;
  constructor(private readonly opts: KVOpts = {}) {
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
    this.store = new Store(
      this.peerRing,
      opts.enableDataSync,
      opts.enableDataSync,
    );
    this._initCache().catch((err) => {
      this.logger.error({ err }, `Failed to init the KV store`);
      this.startupError = err;
    });
  }

  private async _initCache(): Promise<void> {
    this.isInitRunning = true;
    const syncCommands = [
      {
        namespace,
        command: PredefinedCommandsEnum.MDel,
        handler: this.store.mdel.bind(this.store),
      },
      {
        namespace,
        command: PredefinedCommandsEnum.MSet,
        handler: this.store.mset.bind(this.store),
      },
      {
        namespace,
        command: PredefinedCommandsEnum.MGet,
        handler: this.store.mget.bind(this.store),
      },
    ];

    [
      {
        namespace,
        command: Commands.set,
        handler: this.store.set.bind(this.store) as CommandHandler,
      },
      {
        namespace,
        command: Commands.get,
        handler: this.store.get.bind(this.store) as CommandHandler,
      },
      {
        namespace,
        command: Commands.delete,
        handler: this.store.delete.bind(this.store),
      },
    ].forEach((cmd) => {
      this.peerRing.registerCommand(cmd);
    });
    if (this.opts.enableDataSync) {
      syncCommands.forEach((cmd) => this.peerRing.registerCommand(cmd));
    }
    await this.peerRing.initRing();
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

  private reconciliate(command: Command<CacheItem>): CacheItem | undefined {
    //choose latest update(LWW)
    let val: CacheItem | undefined = command.payload;
    if (command.context?.peerResponses?.results?.length) {
      for (const res of command.context.peerResponses.results) {
        if (res.payload?.updatedAt) {
          if (val?.updatedAt) {
            val = val.updatedAt > res.payload.updatedAt ? val : res.payload;
          } else {
            val = res.payload;
          }
        }
      }
    }
    return val;
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
    const command = await this.peerRing.execute<CacheItem>({
      namespace,
      command: Commands.get,
      key,
      opts,
    });
    this.logger.debug({ command }, `receieved from peer ring`);
    if (!command) {
      return undefined;
    }
    const reconciliated = this.reconciliate(command);
    return reconciliated?.item ? JSON.parse(reconciliated.item) : undefined;
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
