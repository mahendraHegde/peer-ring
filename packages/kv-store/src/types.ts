import {
  type PeerRingOpts,
  type LoggerOptType,
  type Command,
} from "@peer-ring/core";
import { type K8sPeerDiscoveryOpts } from "@peer-ring/discovery-k8s";

type PayloadType = Command extends { payload: infer P }
  ? P
  : Record<string, unknown>;
export interface CacheItem extends PayloadType {
  item: string;
  updatedAt: number;
  ttl?: number;
}

export type PeerDiscoveryOpts =
  | PeerRingOpts["peerDiscovery"]
  | K8sPeerDiscoveryOpts;

export interface KVOpts {
  peerRingOpts?: Partial<Omit<PeerRingOpts, "peerDiscovery">> & {
    peerDiscovery: PeerDiscoveryOpts;
  };
  logger?: LoggerOptType;
  /**
   * specifies whether to
   *  copy data to maintain the {@link PeerRingOpts.replicationFactor} when a node goes down or
   *  copy data(tokens) from peer when a node comes up
   *
   * be careful before setting this, it requires copying tokens from client which could be huge depending on your data size,
   * if you cluster goes through frequent scaling, this will add additional overhead of frequent data clone.
   * you should set this, if you prefer durability of your data over performance
   * @defaultValue false
   */
  enableDataSync?: boolean;
}

export enum KVEvents {
  up = "up",
}

export enum Commands {
  set = "set",
  get = "get",
  delete = "delete",
  mget = "mget",
  mset = "mset",
  mdel = "mdel",
}

export const namespace = "PeerRing_KvStore";
