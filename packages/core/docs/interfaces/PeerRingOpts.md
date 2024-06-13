[@peer-ring/core](../README.md) / [Exports](../modules.md) / PeerRingOpts

# Interface: PeerRingOpts

## Table of contents

### Properties

- [logger](PeerRingOpts.md#logger)
- [netManager](PeerRingOpts.md#netmanager)
- [peerDiscovery](PeerRingOpts.md#peerdiscovery)
- [replicationFactor](PeerRingOpts.md#replicationfactor)
- [tokens](PeerRingOpts.md#tokens)
- [virtualNodes](PeerRingOpts.md#virtualnodes)

## Properties

### logger

• `Optional` **logger**: [`LoggerOptType`](../modules.md#loggeropttype)

pino instance or ioptions

#### Defined in

core/src/types.ts:95

---

### netManager

• `Optional` **netManager**: [`InetManager`](InetManager.md) \| `Omit`\<[`NetManagerOpts`](NetManagerOpts.md), `"logger"`\>

[InetManager](InetManager.md) instance or [NetManagerOpts](NetManagerOpts.md)

#### Defined in

core/src/types.ts:74

---

### peerDiscovery

• **peerDiscovery**: `IPeerDiscovery`

[IPeerDiscovery instance](https://github.com/mahendraHegde/peer-ring/packages/discovery/docs/interfaces/IPeerDiscovery.md)

#### Defined in

core/src/types.ts:70

---

### replicationFactor

• `Optional` **replicationFactor**: `number`

specifies how many copies of each records to keep, 1 means only target node, every peer must have the same value.
choose higher number if you prefer availability over consistency

**`Default Value`**

```ts
1;
```

#### Defined in

core/src/types.ts:85

---

### tokens

• `Optional` **tokens**: `number`

specifies how many partitions of the ring to create.
it should be (way)more than Nodes\*virtualNodes, so that every node/vNode get its own token

**`Default Value`**

```ts
1000;
```

#### Defined in

core/src/types.ts:91

---

### virtualNodes

• `Optional` **virtualNodes**: `number`

specifies how many virtual node for each physical node to be added to the ring, value 5 indicate 1 physical and 5 virtual nodes(total 6) to be added to hash ring

**`Default Value`**

```ts
3;
```

#### Defined in

core/src/types.ts:79
