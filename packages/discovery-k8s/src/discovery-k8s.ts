import {
  type IPeerDiscovery,
  type Peer,
  type DiscoveryCallbackFnType,
} from "@peer-ring/discovery";
import { PodPhaseEnum, type K8sPeerDiscoveryOpts } from "./types";
import { type ApiType } from "@kubernetes/client-node";
import * as k8s from "@kubernetes/client-node";
import { pino } from "pino";

export class K8sPeerDiscovery implements IPeerDiscovery {
  watcher: k8s.Watch;
  peerMap = new Map<string, Peer>();
  removeCallbacks: DiscoveryCallbackFnType[] = [];
  addCallbacks: DiscoveryCallbackFnType[] = [];
  k8sApi: ApiType;
  me: Peer;
  isReady: boolean;
  logger: pino.Logger;
  request: Request;
  constructor(private readonly opts: K8sPeerDiscoveryOpts = {}) {
    if (!opts.kubeConfig) {
      opts.kubeConfig = new k8s.KubeConfig();
      opts.kubeConfig.loadFromDefault({});
    }
    this.logger = opts.logger ?? pino({ level: "info" });
    this.logger = this.logger.child({ class: K8sPeerDiscovery.name });
    this.watcher = new k8s.Watch(opts.kubeConfig);
    this.k8sApi = opts.kubeConfig.makeApiClient(k8s.CoreV1Api);
  }

  onPeerAdded(callback: DiscoveryCallbackFnType): void {
    this.addCallbacks.push(callback);
  }

  onPeerRemoved(callback: DiscoveryCallbackFnType): void {
    this.removeCallbacks.push(callback);
  }

  async initDiscovery(): Promise<void> {
    if (this.isReady) return;
    await this.initWatch();
    this.isReady = true;
  }

  private async initWatch(): Promise<void> {
    let isResolved = false;
    const podName = process.env.HOSTNAME;
    return new Promise<void>((resolve, reject) => {
      const response = this.watcher.watch(
        "/api/v1/pods",
        this.opts.watchQueryParams ?? {},
        (type, obj) => {
          const peer: Peer = { ip: obj.status?.podIP, name: obj.metadata.name };
          const { phase } = obj.status ?? {};
          if (obj.status?.podIP) {
            if (phase === PodPhaseEnum.Running) {
              // add event
              if (!this.peerMap.has(obj.status?.podIP as string)) {
                this.peerMap.set(obj.status?.podIP as string, peer);
                void Promise.all(
                  this.addCallbacks.map(async (callback) => callback(peer)),
                ).catch((err) => {
                  this.logger.warn({ err }, `failed to call add callbacks`);
                });
              }
              this.logger.info({ isResolved, name: peer.name, phase, podName });
              if (!isResolved && peer.name === podName) {
                // wait until it discovers itself
                this.logger.debug(
                  "received my running status, resolving initDiscovery",
                );
                isResolved = true;
                this.me = peer;
                resolve();
              }
            } else if (
              [
                PodPhaseEnum.Failed,
                PodPhaseEnum.Succeeded,
                PodPhaseEnum.Terminating,
              ].includes(phase as PodPhaseEnum)
            ) {
              this.peerMap.delete(obj.status?.podIP as string);
              void Promise.all(
                this.removeCallbacks.map(async (callback) => callback(peer)),
              ).catch((err) => {
                this.logger.warn({ err }, `failed to call remove callbacks`);
              });
            }
          }
        },
        (err) => {
          if (err) {
            this.opts.logger?.error({ err }, `Failed to init watch`);
            reject(err);
            return;
          }
          // start watch again
          void this.initWatch().catch((err) => {
            this.opts.logger?.error({ err }, `Failed to init watch`);
          });
        },
      );
      response.then((res) => {
        this.request = res;
      });
    });
  }

  whoAmI(): Peer {
    if (!this.me) {
      const podName = process.env.HOSTNAME;
      this.me = Object.values(this.peerMap).find(
        (peer) => peer.name === podName,
      );
    }
    return this.me;
  }

  async stop(): Promise<void> {
    if ("abort" in this.request && typeof this.request.abort === "function") {
      await this.request.abort();
      this.logger.debug("stopped k8s discovery");
    }
  }

  async getActivePeers(): Promise<Peer[]> {
    return Array.from(this.peerMap.values());
  }
}
