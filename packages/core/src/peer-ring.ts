import { type DiscoveryCallbackFnType, type Peer } from "@peer-ring/discovery";
import { type pino } from "pino";
import * as farmhash from "farmhash";
import {
  type Command,
  type CommandDef,
  type CommandHandler,
  type PeerRingOpts,
  type Node,
  PredefinedCommandsEnum,
  type InetManager,
  ExecuteOpts,
} from "./types";
import { RpcNetManager } from "./rpc";
import { buildLogger } from "./helpers/logger";
import { promiseRaceWithCount } from "./helpers/promises";
import * as assert from "assert";

export class PeerRing {
  nodes: Node[] = [];
  commands: Record<string, CommandHandler> = {};
  _opts: Required<
    Omit<PeerRingOpts, "netManagerOpts" | "netManager" | "logger">
  >;

  private logger: pino.Logger;
  private netManager: InetManager;
  private isReady: boolean;
  private me: Peer;
  private readonly ringSize = 2 ** 32;
  private readonly tokenSize; //size of each token block
  constructor(readonly opts: PeerRingOpts) {
    const logger = buildLogger(opts.logger);
    this.logger = logger.child({ class: PeerRing.name });
    this._opts = {
      ...opts,
      tokens: opts.tokens ?? 1000,
      virtualNodes: opts.virtualNodes ?? 3,
      replicationFactor: opts.replicationFactor ?? 1,
    };

    assert.ok(
      this._opts.replicationFactor > 0,
      `replicationFactor must be greater than 0`,
    );

    this.tokenSize = Math.round(this.ringSize / this._opts.tokens);

    if (opts.netManager) {
      this.netManager =
        "start" in opts.netManager
          ? opts.netManager
          : new RpcNetManager({
              logger,
              ...opts.netManager,
            });
    } else {
      this.netManager = new RpcNetManager({
        logger,
      });
    }
    this.netManager.onMessage((cmd: Command) =>
      this.execute({
        opts: {
          replicationFactor: 1,
          quorumCount: 1,
          forceExecuteOnCurrentNode: true,
        },
        ...cmd,
      }),
    );
  }

  private hashKey(key: string): number {
    const hash = farmhash.hash32(key);
    return hash % this.ringSize;
  }

  private getInsertionPoint(pos: number, token?: number): number {
    // binary search for the pos
    if (!this.nodes.length) {
      return 0;
    }
    let left = 0;
    let right = this.nodes.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midPos = this.nodes[mid].pos;
      if (midPos === pos) {
        return mid;
      } else if (midPos < pos) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    if (token) {
      if (left >= this.nodes.length) {
        //wrap around the ring
        left = 0;
      }
      if (token < this.getToken(this.nodes[left].pos)) {
        //check if previous node owns this token
        //each node owns the token completely even if its hashed on the mid of the token
        const prevIdx = left === 0 ? this.nodes.length - 1 : left - 1;
        return this.getToken(this.nodes[prevIdx].pos) === token
          ? prevIdx
          : left;
      }
    }
    return left; // return the insertion point
  }

  private allocateOnRing(peer: Peer): void {
    // @TODO better algo for even fair allocation
    for (let i = 0; i <= this._opts.virtualNodes; i++) {
      const pos = this.hashKey(`${peer.ip}:${i}`);
      const idx = this.getInsertionPoint(pos);
      const node = { ...peer, pos, isVirtual: i !== 0 };

      if (idx === 0) {
        this.nodes = [node].concat(this.nodes);
      } else if (idx >= this.nodes.length) {
        this.nodes.push(node);
      } else {
        this.nodes.splice(idx, 0, node);
      }
    }
  }

  private deallocateOnRing(peer: Peer): void {
    for (let i = 0; i <= this._opts.virtualNodes; i++) {
      const pos = this.hashKey(`${peer.ip}:${i}`);
      const idx = this.getInsertionPoint(pos);

      if (this.nodes[idx]?.ip === peer.ip) {
        this.nodes.splice(idx, 1);
      }
    }
  }

  private isConsecutiveNode(idx: number, ip: string): boolean {
    const prevIdx = (idx - 1 + this.nodes.length) % this.nodes.length;
    const nextIdx = (idx + 1) % this.nodes.length;

    const isPrevSame = this.nodes[prevIdx]?.ip === ip;
    const isNextSame = this.nodes[nextIdx]?.ip === ip;

    return isPrevSame || isNextSame;
  }

  private getCommandKey(
    def: Pick<CommandDef, "command" | "namespace">,
  ): string {
    return `${def.namespace}:${def.command}`;
  }

  private getToken(pos: number): number {
    //tokens start with 1
    //each token represents a block of data
    //token 1 convers block from pos 0 to this.tokenSize
    //token 2 covers block from this.tokenSize+1 - this.tokenSize*2
    return Math.ceil(pos / this.tokenSize);
  }

  private getPreferenceListForKey(
    key: string,
    replicationFactor: number,
  ): Node[] {
    const pos = this.hashKey(key);
    let idx = this.getInsertionPoint(pos, this.getToken(pos));

    const results: Map<string, Node> = new Map();

    // Determine the responsible node
    if (idx >= this.nodes.length) {
      // If index is equal to the length of nodes array, wrap around to the first node
      results.set(this.nodes[0].ip, this.nodes[0]);
    } else {
      results.set(this.nodes[idx].ip, this.nodes[idx]);
    }
    let startPoint = (idx + 1) % this.nodes.length;
    for (let i = 1; i < replicationFactor && startPoint != idx; i++) {
      //find next nodes in the ring,
      for (; startPoint != idx; ) {
        const candidate = this.nodes[startPoint];
        if (!results.has(candidate.ip)) {
          //choose different node than ones already choosen
          results.set(candidate.ip, candidate);
          break;
        }
        startPoint = (startPoint + 1) % this.nodes.length;
      }
    }
    return Array.from(results.values());
  }

  onPeerAdded(peer: Peer): void {
    this.allocateOnRing(peer);
  }

  onPeerRemoved(peer: Peer): void {
    this.deallocateOnRing(peer);
  }

  async initRing(): Promise<void> {
    if (this.isReady) return;
    if (typeof this._opts.peerDiscovery.initDiscovery === "function") {
      await this._opts.peerDiscovery.initDiscovery();
    }
    const peers = await this._opts.peerDiscovery.getActivePeers();
    this.logger.debug({ peers }, "active peers found");
    peers.forEach((peer) => {
      this.allocateOnRing(peer);
    });
    this._opts.peerDiscovery.onPeerAdded(
      this.onPeerAdded.bind(this) as DiscoveryCallbackFnType,
    );
    this._opts.peerDiscovery.onPeerRemoved(
      this.onPeerRemoved.bind(this) as DiscoveryCallbackFnType,
    );
    this.me = await this._opts.peerDiscovery.whoAmI();
    if (typeof this.netManager.setIp === "function")
      this.netManager.setIp(this.me.ip);
    await this.netManager.start();
    this.isReady = true;
    this.logger.debug("initRing success");
  }

  public registerCommand<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(def: CommandDef<T>): void {
    this.commands[this.getCommandKey(def)] = def.handler;
  }

  public isAReplica(targetNodes: Node[]): boolean {
    return !!targetNodes.find((node) => node.ip === this.me.ip);
  }

  public async execute<T extends Record<string, unknown>>(
    command: Command,
  ): Promise<undefined | Command<T>> {
    // take quorum as input for replication, and send the same command to W/R number of peers
    // to achive quorum when peer dies, it would require data copy from another replica to new peer
    this.logger.debug({ command, peers: this.nodes }, `received command`);
    if (command.command === PredefinedCommandsEnum.EmptyReply) {
      return;
    }
    const { opts } = command;

    const replicationFactor =
      opts?.replicationFactor ?? this._opts.replicationFactor ?? 1;
    assert.ok(
      replicationFactor > 0,
      `replicationFactor must be greater than 0`,
    );

    const currentQuorum = opts?.quorumCount ?? 1;
    assert.ok(currentQuorum > 0, `quorumCount must be greater than 0`);

    const { key } = command;
    const nodes = this.getPreferenceListForKey(key, replicationFactor);
    this.logger.debug({ nodes, command, opts }, `selected nodes for key`);

    const getPeerResults = async (
      nodes: Node[],
      quorumCount?: number,
    ): Promise<
      ReturnType<typeof promiseRaceWithCount<Command<T>>> | undefined
    > => {
      quorumCount = quorumCount ?? currentQuorum;
      const { results, errors } = await promiseRaceWithCount<Command<T>>(
        nodes.map((peer) => this.netManager.sendMessage<T>(peer.ip, command)),
        quorumCount,
      );
      this.logger.debug(
        { results, errors },
        `received response/errors from peers`,
      );
      if (results.length || errors.length) {
        return {
          results: results.filter((result) => !!result) as Command<T>[],
          errors,
        };
      }
    };
    const isAReplica = await this.isAReplica(nodes); //prefer reading on current node first
    if (isAReplica || opts?.forceExecuteOnCurrentNode) {
      this.logger.debug(
        {
          command,
          isAReplica,
          forceExecuteOnCurrentNode: opts?.forceExecuteOnCurrentNode,
        },
        `executing on current node`,
      );
      const func = this.commands[this.getCommandKey(command)];
      if (typeof func !== "function") {
        throw new Error(
          `command ${command.command} not found in namespace ${command.namespace}.`,
        );
      }

      //if quorum is not more than 1, we make unnecesary network calls
      const peerResponses =
        currentQuorum > 1
          ? await getPeerResults(
              nodes.filter((node) => node.ip !== this.me.ip),
              currentQuorum - 1,
            )
          : undefined;

      const resp = await func(command.key, command.payload);
      this.logger.debug({ command }, `command executed on current node`);
      if (resp && peerResponses) {
        resp.context = { peerResponses };
      }
      this.logger.debug({ command, resp }, `sending response back to the peer`);
      return resp as Command<T>;
    }
    this.logger.debug({ command, nodes }, `sending command to peers`);
    const resp = await getPeerResults(nodes);
    this.logger.debug(
      { command, nodes, resp },
      `command executed on peer nodes`,
    );
    if (!resp) {
      return;
    }
    if (resp.results.length) {
      resp.results[0].context = {
        peerResponses: { ...resp, results: resp.results.slice(1) },
      };
      return resp.results[0];
    }
    if (resp.errors.length) {
      //every request errored
      throw resp.errors;
    }
  }

  async stop(): Promise<void> {
    const promises: Array<Promise<void>> = [];

    if (typeof this.netManager.stop === "function") {
      promises.push(this.netManager.stop());
    }

    if (typeof this._opts.peerDiscovery.stop === "function") {
      promises.push(this._opts.peerDiscovery.stop());
    }

    await Promise.all(promises);
  }
}
