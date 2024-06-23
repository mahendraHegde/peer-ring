import type k8s from "@kubernetes/client-node";
import { type pino } from "pino";

export interface K8sPeerDiscoveryOpts {
  watchQueryParams?: Record<string, unknown>;
  kubeConfig?: k8s.KubeConfig;
  logger?: pino.Logger;
}
export enum PodPhaseEnum {
  Running = "Running",
  Failed = "Failed",
  Succeeded = "Succeeded",
  Terminating = "Terminating",
}
