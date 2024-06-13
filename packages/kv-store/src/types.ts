import {
  type PeerRingOpts,
  type LoggerOptType,
  type Command,
  type ExecuteOpts,
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
}

export enum KVEvents {
  up = "up",
}

export enum Commands {
  set = "set",
  get = "get",
  delete = "delete",
}

export const namespace = "PeerRing_KvStore";
