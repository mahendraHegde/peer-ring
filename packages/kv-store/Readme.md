#### @peer-ring/kv-store

`@peer-ring/kv-store`: a distributed, decentralized, and embeddable in-memory key-value store crafted to seamlessly integrate with your applications. Tailor consistency per key to balance performance and reliability.

### Why Consider @peer-ring/kv-store?

Ever needed a fast in-memory store for your applications, but faced challenges with synchronization across replicas (e.g., in Kubernetes)? Traditional solutions like Redis can bring complexity and additional management overhead.

`@peer-ring/kv-store` offers a simpler path. Embed it directly into your application to maintain consistent access to cached data across all replicas. Whether you're scaling up or down, your data stays safe and accessible, with optional replication for added peace of mind.

### How It Works

Fueled by `@peer-ring/core`, `@peer-ring/kv-store` uses `consistent hashing` to distribute data efficiently. Writes are spread across replicas, ensuring resilience without compromising speed.

`@peer-ring/kv-store` currently only supports only k8s based peer discovery, which means you can only use it if you are running your apps on kubernetes.

![No Image](https://raw.githubusercontent.com/mahendraHegde/peer-ring/main/packages/kv-store/docs/kv-store.png)

### Where It Fits

- **Between Embedded Caching and Hosted Solutions:** It bridges the gap, providing the ease of in-memory caching with distributed system reliability.
- **An Alternative, Not a Replacement:** While not displacing solutions like Redis, it offers a cost-effective choice where simpler management and lower costs meet your data storage needs.

### How to use

1. install

```
npm i @peer-ring/kv-store`
```

2. Use it like a normal kv store.

```typescript
import { KVStore } from "@peer-ring/kv-store";

const watchQueryParams = { labelSelector: `app=your-awesome-app` };
const kv = new KVStore({
  peerRingOpts: {
    peerDiscovery: {
      watchQueryParams,
    },
    netManager: {
      port: 4445, //grpc port used by @peer-ring/core for all p2p communication
    },
  },
  logger: {
    level: "warn", //pino logger options
  },
});

await kv.init();

await kv.set("name", "peer-ring", { ttl: 1000 });
const name = await kv.get<string>("name");
console.log(name);
await kv.delete("name");
```

generated types for peerRingOpts can be found [here](https://github.com/mahendraHegde/peer-ring/blob/main/packages/core/docs/interfaces/PeerRingOpts.md)

Notes:

1. [@peer-ring/core](https://github.com/mahendraHegde/peer-ring/tree/main/packages/core) is still under development\_, you can use it as long as you are not bothered about durability of cached data. [read here](https://github.com/mahendraHegde/peer-ring?tab=readme-ov-file#replication) to understand how to choose the best quorum for your application.
2. Currently Kv-store only works on top of k8s, other peer-discovery mechanisms are [WIP](https://github.com/mahendraHegde/peer-ring?tab=readme-ov-file#project-roadmap).
3. make sure that the application running on k8s has `"get", "watch", "list"` permission to listen to pod changes.
4. data resides inside the pod(sharded across the replicas), so pod's memory is the limit of amount of data you can store.
5. if possible run kv-store as a sidecar container for better separation from application(no out of the box solution yet, however its as simple as running another container with a REST server, check [**e2e**](https://github.com/mahendraHegde/peer-ring/blob/main/packages/__e2e__/src/index.ts) for inspiration)

> Make sure to check the features/limitations [here](https://github.com/mahendraHegde/peer-ring)
