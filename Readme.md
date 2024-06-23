#### peer-ring

> Distributed, Decentralized Sharding Framework for building distributed storage or similar solutions, inspired by [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)

Peer-ring is designed to be storage or use case agnostic. It acts as a base framework for building distributed solutions. Some sample applications that can be built on top of peer-ring include:

- [x] [Distributed KV store](https://www.npmjs.com/package/@peer-ring/kv-store): Distributed In-memory key-value store that can be embedded into your application.
- [ ] Distributed Rate Limiter: Rate limiter that can be deployed close to your application for greater performance.
- [ ] Distributed Pub-Sub: In-memory pub-sub/queue system for application synchronization.
      ... and many more.

---

#### Modules

Peer-ring is divided into three major modules:

1. **Peer Discovery:** Responsible for membership management. Supported peer discovery strategies include:
   - [x] [K8s based](https://www.npmjs.com/package/@peer-ring/discovery-k8s)
   - [ ] Registry based (etcd/ZooKeeper)
   - [ ] SWIM or gossip based
2. **Core:** The core module is responsible for distributed sharding, key ownership identification, P2P communication, quorum, and replication management. It uses a custom request/response model built on top of gRPC bidirectional stream for efficient P2P communication.
3. **Applications:** This is the end-user layer built on top of peer-ring/core and utilizes one of the peer discovery strategies. Examples include:
   - [x] [Distributed KV store](https://www.npmjs.com/package/@peer-ring/kv-store): In-memory key-value store.
   - [ ] Distributed Rate Limiter: Rate limiter that can be deployed close to your application for greater performance.
   - [ ] Distributed Pub-Sub: In-memory pub-sub/queue system for application synchronization.

---

#### Replication

Peer-ring provides `replication` and `sloppy quorum` for high availability. You can tweak the behavior using [`replicationFactor`](https://github.com/mahendraHegde/peer-ring/blob/main/packages/core/docs/interfaces/ExecuteOpts.md#replicationfactor) and [`quorumCount`](https://github.com/mahendraHegde/peer-ring/blob/main/packages/core/docs/interfaces/ExecuteOpts.md#quorumcount). You can choose among these characteristics:

1. **Consistency (default)**: Choose `replicationFactor=1` and `quorumCount=1` for better consistency and low latency, but you will sacrifice availability and durability (i.e., your data is lost if the owner replica dies).
2. **Availability**: Choose `replicationFactor>=3` and `quorumCount=1` for high availability. You can tweak `quorumCount` according to your consistency needs, higher `replicationFactor` and `quorumCount` means more latency.
3. **Durability**: The current implementation does not offer strong durability. If all replicas holding a particular `key` die, you will lose the `key`. A better durability solution (maintaining the replication factor when a node goes down, redistributing when a new node comes up) is [WIP](https://github.com/mahendraHegde/peer-ring?tab=readme-ov-file#project-roadmap).

---

#### Project Roadmap

This roadmap outlines the planned development and milestones for the project. Contributions and suggestions are welcome.

##### Milestone 1: Initial Release

**Status:** In Progress

- [x] Design system architecture
- [x] Develop basic peer discovery module with k8s
- [x] Implement core sharding functionality
- [x] Implement replication and quorum
- [x] Implement in-memory KV store
- [ ] Handle failures by token transfer when a peer goes down or comes back up [*in Alpha*]
  - [x] steal data/tokens from peer when new node is added
  - [x] when data owner node goes down, the previous node will own the tokens of the node went down, it should copy data/tokens from replicas.
  - [ ] when replica goes down, the previous node will own the tokens of the node went down, it should copy the data/tokens from other replicas/owner
- [ ] Write comprehensive documentation
- [ ] Create a contribution guide and code of conduct
- [ ] Set up continuous integration (CI) pipeline

##### Milestone 2: Stability and Scalability

**Status:** Planned

- [ ] deployment as sidecar
- [ ] Conduct thorough testing and validation

##### Milestone 3: Enhanced Features

**Status:** Planned

- [ ] Develop distributed rate limiter
- [ ] Support custom reconciliation/read repair by the client
- [ ] Implement advanced peer discovery strategies
  - [ ] Registry based (etcd/ZooKeeper)
  - [ ] SWIM or gossip based
- [ ] Create distributed pub-sub system
- [ ] Optimize performance and resource usage

##### Milestone 4: Community and Ecosystem

**Status:** Planned

- [ ] Develop monitoring/metrics layer
- [ ] Create a guide for building custom applications on top of peer-ring
- [ ] Provide detailed usage examples and tutorials
- [ ] improve data sync with Anti-entropy

---

#### Contributing

Contributions are more than welcome. Reading [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) before contributing can make your life easier but is not a strict requirement. Read more about contributing [here](https://github.com/mahendraHegde/peer-ring/CONTRIBUTING.md).

---

#### Release

1. pnpm changeset
2. commit changes
3. pnpm prepare:publish
4. pnpm publish -r --filter=\!__e2e__ --filter=\!peer-ring --dry-run
