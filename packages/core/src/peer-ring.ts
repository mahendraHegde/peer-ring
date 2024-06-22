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
} from "./types";
import { RpcNetManager } from "./rpc";
import { buildLogger } from "./helpers/logger";
import { promiseRaceWithCount } from "./helpers/promises";
import * as assert from "assert";
import { isFunction } from "./helpers/functions";
import { getBatchedKeys } from "./helpers/array";

export class PeerRing {
  nodes: Node[] = [];
  commands: Record<string, CommandHandler> = {};
  _opts: Required<
    Omit<PeerRingOpts, "netManagerOpts" | "netManager" | "logger">
  >;
  private namespaces: Set<string> = new Set();

  private logger: pino.Logger;
  private netManager: InetManager;
  private isReady: boolean;
  private me: Peer;
  private readonly ringSize = 2 ** 32;
  private readonly tokenSize; //size of each token block
  private keysMeta: Map<number, Map<string, boolean>> = new Map(); //{token:{key:true}}
  constructor(readonly opts: PeerRingOpts) {
    const logger = buildLogger(opts.logger);
    this.logger = logger.child({ class: PeerRing.name });
    this._opts = {
      ...opts,
      tokens: opts.tokens ?? 1000,
      virtualNodes: opts.virtualNodes ?? 3,
      replicationFactor: opts.replicationFactor ?? 1,
      initiateDataStealDelay: opts.initiateDataStealDelay ?? 2000,
      newPeerCoolDownDelay: opts.newPeerCoolDownDelay ?? 5,
    };

    //@TODO assert all props
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
    this.netManager.onMessageStream(
      this.executeStream.bind(this) as typeof this.executeStream,
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

  private getMinCoolDownTime = (): Date => {
    const minCoolDownTime = new Date();
    minCoolDownTime.setSeconds(
      minCoolDownTime.getSeconds() - this._opts.newPeerCoolDownDelay,
    );
    return minCoolDownTime;
  };

  private getPrevIdx = (idx: number): number =>
    idx === 0 ? this.nodes.length - 1 : idx - 1;

  private getNextIdx = (idx: number): number => (idx + 1) % this.nodes.length;

  private getPrevActiveNode = (
    idx: number,
    ip: string,
    ignoreCooldown: boolean,
  ): Node | undefined => {
    let prevIdx = this.getPrevIdx(idx);
    const minCoolDownTime = this.getMinCoolDownTime().getTime();
    for (let i = 0; i < this.nodes.length; i++) {
      if (
        this.nodes[prevIdx] &&
        this.nodes[prevIdx].ip !== ip &&
        (ignoreCooldown || this.nodes[prevIdx].addedAt <= minCoolDownTime)
      ) {
        //select the node which is not me and is started minCoolDownTime ago(so that it would have the data to copy)
        return this.nodes[prevIdx];
      }
      prevIdx = this.getPrevIdx(prevIdx);
    }
  };

  private getNextNode = (idx: number): Node | undefined => {
    const node = this.nodes[idx];
    let nextIdx = this.getNextIdx(idx);
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[nextIdx].ip !== node.ip) {
        return this.nodes[nextIdx];
      }
      nextIdx = this.getPrevIdx(nextIdx);
    }
  };

  private async initiateDataTransfer(
    isAdded: boolean,
    removedPeer?: Peer,
  ): Promise<void> {
    const validTransferNamespaces: string[] = [];
    this.namespaces.forEach((namespace) => {
      const mGetFunc =
        this.commands[
          this.getCommandKey({
            namespace,
            command: PredefinedCommandsEnum.MGet,
          })
        ];
      const mSetFunc =
        this.commands[
          this.getCommandKey({
            namespace,
            command: PredefinedCommandsEnum.MSet,
          })
        ];
      if (isFunction(mSetFunc) && isFunction(mGetFunc)) {
        validTransferNamespaces.push(namespace);
      }
    });

    if (!validTransferNamespaces.length) {
      //no point in trying to sync if mGet/mSet commands are not present
      this.logger.warn(
        { commands: this.commands },
        `no mGet/mSet registered so ignoring the data transfer`,
      );
      return;
    }

    const node2TokenMap = new Map<string, Set<number>>();
    const node = isAdded ? this.me : removedPeer ?? this.me;
    for (const { idx, pos } of this.getPosOnRing(node)) {
      //find the immediate physical peer(not itself, as vitrual nodes can be adjecent)
      //when added: new node steals tokens from pre node
      //when removed: current node(new owner) copies tokens from next node(hoping replicationFactor for (at least some) keys is >1 )
      const prevNode = this.getPrevActiveNode(idx, node.ip, isAdded);
      if (
        !isAdded &&
        (prevNode?.ip !== this.me.ip || this.nodes.length === 1)
      ) {
        //current node doesnt own the space
        //or only current node is left, so ignore the remove event as no data to copy
        continue;
      }
      //when removed, nextNode is at the current node's position
      const nextNode = isAdded
        ? this.getNextNode(idx)
        : this.nodes[idx >= this.nodes.length ? 0 : idx];
      const token = this.getToken(pos);
      //these will be undefined, if current node is the only node present in the ring
      if (prevNode && nextNode) {
        const nextNodeToken = this.getToken(nextNode.pos);
        //when added: prev node would have the owned the tokens
        //when removed: current(prev of removed node) node should ask for nextNode of the removed node for data
        const targetIp = isAdded ? prevNode.ip : nextNode.ip;
        const tokens = node2TokenMap.get(targetIp) ?? new Set<number>();
        if (token > nextNodeToken) {
          //nextNode is wrapped around the ring
          for (let i = token; i < this._opts.tokens + nextNodeToken; i++) {
            const val = i > this._opts.tokens ? i - this._opts.tokens : i;
            tokens.add(val);
          }
        } else {
          for (let i = token; i < nextNodeToken; i++) {
            //tokens star from 1 so +1 to tokens for finding reminder
            tokens.add(i % (this._opts.tokens + 1));
          }
        }

        node2TokenMap.set(targetIp, tokens);
      }
    }
    if (node2TokenMap.size == 0) return;

    for (const [ip, tokens] of node2TokenMap.entries()) {
      if (tokens.size == 0) {
        continue;
      }

      for (const namespace of validTransferNamespaces) {
        const mSetFunc =
          this.commands[
            this.getCommandKey({
              namespace,
              command: PredefinedCommandsEnum.MSet,
            })
          ];
        const cmd = isAdded
          ? PredefinedCommandsEnum.MoveData
          : PredefinedCommandsEnum.CopyData;
        const command: Command<{ tokens: number[] }> = {
          command: cmd,
          key: cmd,
          namespace,
          payload: {
            tokens: Array.from(tokens.values()),
          },
        };
        try {
          const generator = this.netManager.getDataStream(ip, command);
          for await (const data of generator) {
            await mSetFunc(data);
          }
        } catch (err) {
          this.logger.error(
            { ip, err, command },
            `Failed to copy/move tokens from peer`,
          );
        }
      }
      this.logger.debug(
        { ip, tokens: Array.from(tokens.values()) },
        `transfer data complete from peer.`,
      );
    }
  }

  private *getPosOnRing(
    peer: Peer,
  ): Generator<{ node: Node; idx: number; pos: number }> {
    for (let i = 0; i <= this._opts.virtualNodes; i++) {
      const pos = this.hashKey(`${peer.ip}:${i}`);
      const idx = this.getInsertionPoint(pos);
      const node = { ...peer, pos, isVirtual: i !== 0, addedAt: Date.now() };
      yield { node, idx, pos };
    }
  }

  private allocateOnRing(peer: Peer): void {
    // @TODO better algo for even fair allocation
    // @TODO what if 2 nodes hashed on same token?
    for (const { node, idx } of this.getPosOnRing(peer)) {
      if (idx === 0) {
        this.nodes = [node].concat(this.nodes);
      } else if (idx >= this.nodes.length) {
        this.nodes.push(node);
      } else {
        this.nodes.splice(idx, 0, node);
      }
    }
  }

  private deallocateFromRing(peer: Peer): void {
    for (let i = 0; i <= this._opts.virtualNodes; i++) {
      const pos = this.hashKey(`${peer.ip}:${i}`);
      const idx = this.getInsertionPoint(pos);

      if (this.nodes[idx]?.ip === peer.ip) {
        this.nodes.splice(idx, 1);
      }
    }
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
    //token 2 covers block from this.tokenSize+1 -> this.tokenSize*2
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

  async *executeStream<T extends Record<string, unknown>>(
    command: Command<{ tokens: number[] }>,
  ): AsyncGenerator<Command<T>> {
    const mGetFunc =
      this.commands[
        this.getCommandKey({
          ...command,
          command: PredefinedCommandsEnum.MGet,
        })
      ];
    if (!isFunction(mGetFunc)) {
      return;
    }
    const mDelFunc =
      this.commands[
        this.getCommandKey({
          ...command,
          command: PredefinedCommandsEnum.MDel,
        })
      ];
    if (!command.payload?.tokens?.length) return;
    for (const token of command.payload?.tokens) {
      const metaPayload = this.keysMeta.get(+token);
      if (!metaPayload?.size) continue;
      for (const arr of getBatchedKeys(metaPayload)) {
        const payload = {
          keys: arr,
        };
        const cmd = { ...command, payload };
        const data = await mGetFunc(cmd);
        if (data) {
          yield data as Command<T>;
        }
        if (
          isFunction(mDelFunc) &&
          command.command === PredefinedCommandsEnum.MoveData
        ) {
          await mDelFunc(cmd);
        }
      }
    }
  }

  onPeerAdded(peer: Peer): void {
    if (this.nodes.find((node) => node.ip === peer.ip)) {
      //avoid duplicates
      return;
    }
    this.allocateOnRing(peer);
    this.logger.debug(
      {
        peer,
        nodes: this.nodes.map((node) => ({
          ...node,
          token: this.getToken(node.pos),
        })),
      },
      `nodes picture after add`,
    );
  }

  async onPeerRemoved(peer: Peer): Promise<void> {
    this.logger.debug(
      {
        peer,
        nodes: this.nodes.map((node) => ({
          ...node,
          token: this.getToken(node.pos),
        })),
      },
      `nodes picture before remove`,
    );
    this.deallocateFromRing(peer);
    this.logger.debug(
      {
        peer,
        nodes: this.nodes.map((node) => ({
          ...node,
          token: this.getToken(node.pos),
        })),
      },
      `nodes picture after remove`,
    );

    //@TODO copy from replicas when they go down?
    //current implementation only copies from replicas if owner goes down
    //i.e if node-A owns token 1 and node-B has replica(but not owner), if B goes down token 1 is not copied to next node
    //to handle this `keysMeta` should also contain info aboput replicationFactor,
    // when node goes down, every node(should set up a threshold or it would create a lot of connection noise) would have to check,
    // if it needs to own the replica of the node went down
    await this.initiateDataTransfer(false, peer);
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
    await new Promise((resolve, reject) =>
      setTimeout(
        () => this.initiateDataTransfer(true).then(resolve).catch(reject),
        this._opts.initiateDataStealDelay,
      ),
    ); //wait for other pods to come up
    this.isReady = true;
    this.logger.debug("initRing success");
  }

  public registerCommand<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(def: CommandDef<T>): void {
    this.namespaces.add(def.namespace);
    this.commands[this.getCommandKey(def)] = def.handler;
  }

  public isAReplica(targetNodes: Node[]): boolean {
    return !!targetNodes.find((node) => node.ip === this.me.ip);
  }

  public updateKeysMeta(keys: string[], kind: "set" | "get" | "delete") {
    if (kind === "get") return;
    const val = kind === "set";
    for (let key of keys) {
      const token = this.getToken(this.hashKey(key));
      const payload = this.keysMeta.get(token) ?? new Map<string, boolean>();
      if (val) {
        payload.set(key, val);
      } else {
        payload.delete(key);
      }
      this.keysMeta.set(token, payload);
      this.logger.debug(
        { token, payload: Array.from(payload.keys()) },
        `meta updated`,
      );
    }
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
        nodes.map((peer) => this.netManager.makeRequest<T>(peer.ip, command)),
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

      const resp = await func(command);
      this.logger.debug(
        { command, resp, peerResponses },
        `command executed on current node`,
      );
      if (resp || peerResponses) {
        const finalResp = resp?.payload ? resp : peerResponses?.results[0];
        if (!finalResp) {
          if (peerResponses?.errors?.length) {
            throw peerResponses?.errors;
          }
          return;
        }
        if (peerResponses) {
          finalResp.context = {
            peerResponses: resp?.payload
              ? peerResponses
              : { ...peerResponses, results: peerResponses.results.slice(1) },
          };
        }
        return finalResp as Command<T>;
      }
      this.logger.debug({ command, resp }, `sending response back to the peer`);
      return resp;
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
