#### peer-ring

> Distributed, Decentralized Sharding Framework for building distributed storage or similar solutions, inspired by [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)

Peer-ring is designed to be storage or use case agnostic. It acts as a base framework for building distributed solutions. Some sample applications that can be built on top of peer-ring include:

- [x] [Distributed KV store](https://www.npmjs.com/package/@peer-ring/kv-store): In-memory key-value store.
- [ ] Distributed Rate Limiter: Rate limiter that can be deployed close to your application for greater performance.
- [ ] Distributed Pub-Sub: In-memory pub-sub/queue system for application synchronization.
      ... and many more.

read more about the project [here](https://github.com/mahendraHegde/peer-ring)

> Unless you are developing a distributed application on top of peer-ring, you most likely wont use this package directly, you might be interested in [Distributed KV store](https://www.npmjs.com/package/@peer-ring/kv-store).

1. install
```
npm i @peer-ring/core @peer-ring/discovery-k8s
```
2. use
```typescript
import { K8sPeerDiscovery } from "@peer-ring/discovery-k8s";
import {
  type CommandHandler,
  PeerRing,
  buildLogger,
  type PeerRingOpts,
  ExecuteOpts,
} from "@peer-ring/core";

const watchQueryParams = { labelSelector: `app=your-awesome-app` };

const discovery = new K8sPeerDiscovery({
  watchQueryParams,
});

const peerRing = new PeerRing({
  peerDiscovery: discovery,
  // ...more_opts
});

await peerRing.initRing();

//the command handle will be executed on the peer where the key is sharded
await peerRing.registerCommand({
  namespace: "my_app",
  command: "set",
  handler: (key: string, payload?: string) => {},
});

// Start executing commands
// peering will exxecute the command on current node if its the owner of the key if not it will execute it on the peer node and gives the response back from the handler registered above
await peerRing.execute({
  namespace: "my_app",
  command: "set",
  key: "k1",
  payload: "anything",
});
```

generated types for peerRingOpts can be found [here](https://github.com/mahendraHegde/peer-ring/blob/main/packages/core/docs/interfaces/PeerRingOpts.md)

