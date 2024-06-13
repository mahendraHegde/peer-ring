export class Peer {
  ip: string;
  name?: string;
}
export type DiscoveryCallbackFnType = (peer: Peer) => void | Promise<void>;

export interface IPeerDiscovery {
  getActivePeers: () => Promise<Peer[]> | Peer[];
  onPeerAdded: (callback: DiscoveryCallbackFnType) => void;
  onPeerRemoved: (callback: DiscoveryCallbackFnType) => void;
  whoAmI: () => Promise<Peer> | Peer;
  stop?: () => Promise<void>;
  initDiscovery?: () => Promise<void>;
}
