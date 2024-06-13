#### peer-ring

> Distributed, Decentralized Sharding Framework for building distributed storage or similar solutions, inspired by [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)

Peer-ring is designed to be storage or use case agnostic. It acts as a base framework for building distributed solutions. Some sample applications that can be built on top of peer-ring include:

- [x] [Distributed KV store](https://www.npmjs.com/package/@peer-ring/kv-store): In-memory key-value store.
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

#### Project Roadmap

This roadmap outlines the planned development and milestones for the project. Contributions and suggestions are welcome.

##### Milestone 1: Initial Release

**Status:** In Progress

- [x] Design system architecture
- [x] Implement core sharding functionality
- [x] Develop basic peer discovery module with k8s
- [x] Implement in-memory KV store
- [ ] Handle failures by token transfer when a peer goes down or comes back up
- [ ] Write comprehensive documentation
- [ ] Set up continuous integration (CI) pipeline

##### Milestone 2: Stability and Scalability

**Status:** Planned

- [ ] Conduct thorough testing and validation
- [ ] Improve fault tolerance mechanisms
- [ ] Implement dynamic scaling features

##### Milestone 3: Enhanced Features

**Status:** Planned

- [ ] Implement advanced peer discovery strategies
  - [ ] Registry based (etcd/ZooKeeper)
  - [ ] SWIM or gossip based
- [ ] Develop distributed rate limiter
- [ ] Create distributed pub-sub system
- [ ] Optimize performance and resource usage

##### Milestone 4: Community and Ecosystem

**Status:** Planned

- [ ] Develop a user-friendly website and documentation portal
- [ ] Create a contribution guide and code of conduct
- [ ] Provide detailed usage examples and tutorials

---

#### Contributing

Contributions are more than welcome. Reading [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) before contributing can make your life easier but is not a strict requirement. Read more about contributing [here](https://github.com/mahendraHegde/peer-ring/CONTRIBUTING.md).
