import { type IPeerDiscovery, Peer } from "@peer-ring/discovery";

import { type pino, type LoggerOptions } from "pino";

export enum PredefinedCommandsEnum {
  EmptyReply = "PeerRing_EmptyReply",
  Reply = "PeerRing_Reply",
  StealData = "PeerRing_StealData", // to steal data. when new peer comes up, it will send this message to all peers having its chunk
  MoveData = "PeerRing_MoveData", // to move data. when a peer dies, hashring will tell the right peer(replica) that it needs to send the chunk to new peer
}

export interface InetManager {
  /**
   * @param callback is called when the message is received by a peer
   */
  onMessage: (
    callback: (
      command: Command,
    ) => Command | undefined | Promise<Command | undefined>,
  ) => void;

  /**
   * called by the ring manager to communicate commands to peers
   * @param ip ip of the destination peer
   * @param command command to send
   */
  sendMessage: <T extends Record<string, unknown> = Record<string, unknown>>(
    ip: string,
    command: Command,
  ) => Promise<Command<T>>;
  start: () => Promise<void>;

  /**
   * optional method called by the ring manager, when present to set the node's ip
   * @param ip ip of the current node
   */
  setIp?: (ip: string) => void;

  stop?: () => Promise<void>;
}

export type LoggerOptType = LoggerOptions | pino.Logger;

export class Node extends Peer {
  isVirtual: boolean;
  pos: number;
}

export interface NetManagerOpts {
  /**
   * RPC port for inter peer communication
   * @defaultValue 4444
   */
  port?: number;
  /**
   * timeout value in milliseconds for rpc req/response
   * @defaultValue 2000
   */
  requestTimeout?: number;
  /**
   * pino instance or options
   */
  logger?: LoggerOptType;
}

export interface PeerRingOpts {
  /**
   * {@link https://github.com/mahendraHegde/peer-ring/packages/discovery/docs/interfaces/IPeerDiscovery.md IPeerDiscovery instance}
   */
  peerDiscovery: IPeerDiscovery;
  /**
   * {@link InetManager} instance or {@link NetManagerOpts}
   */
  netManager?: InetManager | Omit<NetManagerOpts, "logger">;
  /**
   * specifies how many virtual node for each physical node to be added to the ring, value 5 indicate 1 physical and 5 virtual nodes(total 6) to be added to hash ring
   * @defaultValue 3
   */
  virtualNodes?: number;
  /**
   * specifies how many copies of each records to keep, 1 means only target node, every peer must have the same value.
   * choose higher number if you prefer availability over consistency
   * @defaultValue 1
   */
  replicationFactor?: number;
  /**
   * specifies how many partitions of the ring to create.
   * it should be (way)more than Nodes*virtualNodes, so that every node/vNode get its own token
   * @defaultValue 1000
   */
  tokens?: number;
  /**
   * pino instance or ioptions
   */
  logger?: LoggerOptType;
}

export type CommandHandler<
  T extends Record<string, unknown> = Record<string, unknown>,
> = (
  key: Command["key"],
  payload: Command["payload"],
) => Promise<undefined | Command<T>> | Command<T> | undefined;

export interface CommandBase {
  namespace: string;
  command: string;
}
export interface CommandDef<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends CommandBase {
  handler: CommandHandler<T>;
}

export interface Command<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends CommandBase {
  key: string;
  payload?: T;
  opts?: ExecuteOpts;
  context?: {
    peerResponses: { results: Array<Command<T>>; errors: Error[] }; //its always for the client to perform reconciliation, read repair etc, not sent to peers over rpc
  };
}

export interface ExecuteOpts {
  /**
   * specifies how many replicas to consult to achieve the quorum, must be less than or equal to  {@link PeerRingOpts.replicationFactor}
   *  @defaultValue 1
   */
  quorumCount?: number;
  /**
   * overrides {@link PeerRingOpts.replicationFactor},
   * if you provide this for a key.it is your responsibility to provide the same value for all operations for the choosen key.
   * i.e giving factor of 1 for writes and 3 for reads would result in no quorum, and unncesary network calls
   */
  replicationFactor?: number;

  /**
   * executes the command awlays on the current node, irrespective of the owner
   * Used internally only, while executing replicated requests
   */
  forceExecuteOnCurrentNode?: boolean;
}
