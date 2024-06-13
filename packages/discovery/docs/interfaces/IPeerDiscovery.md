[@peer-ring/discovery](../README.md) / [Exports](../modules.md) / IPeerDiscovery

# Interface: IPeerDiscovery

## Table of contents

### Properties

- [getActivePeers](IPeerDiscovery.md#getactivepeers)
- [initDiscovery](IPeerDiscovery.md#initdiscovery)
- [onPeerAdded](IPeerDiscovery.md#onpeeradded)
- [onPeerRemoved](IPeerDiscovery.md#onpeerremoved)
- [stop](IPeerDiscovery.md#stop)
- [whoAmI](IPeerDiscovery.md#whoami)

## Properties

### getActivePeers

• **getActivePeers**: () => [`Peer`](../classes/Peer.md)[] \| `Promise`\<[`Peer`](../classes/Peer.md)[]\>

#### Type declaration

▸ (): [`Peer`](../classes/Peer.md)[] \| `Promise`\<[`Peer`](../classes/Peer.md)[]\>

##### Returns

[`Peer`](../classes/Peer.md)[] \| `Promise`\<[`Peer`](../classes/Peer.md)[]\>

#### Defined in

types.ts:8

---

### initDiscovery

• `Optional` **initDiscovery**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

types.ts:13

---

### onPeerAdded

• **onPeerAdded**: (`callback`: [`DiscoveryCallbackFnType`](../modules.md#discoverycallbackfntype)) => `void`

#### Type declaration

▸ (`callback`): `void`

##### Parameters

| Name       | Type                                                               |
| :--------- | :----------------------------------------------------------------- |
| `callback` | [`DiscoveryCallbackFnType`](../modules.md#discoverycallbackfntype) |

##### Returns

`void`

#### Defined in

types.ts:9

---

### onPeerRemoved

• **onPeerRemoved**: (`callback`: [`DiscoveryCallbackFnType`](../modules.md#discoverycallbackfntype)) => `void`

#### Type declaration

▸ (`callback`): `void`

##### Parameters

| Name       | Type                                                               |
| :--------- | :----------------------------------------------------------------- |
| `callback` | [`DiscoveryCallbackFnType`](../modules.md#discoverycallbackfntype) |

##### Returns

`void`

#### Defined in

types.ts:10

---

### stop

• `Optional` **stop**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

types.ts:12

---

### whoAmI

• **whoAmI**: () => [`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

#### Type declaration

▸ (): [`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

##### Returns

[`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

#### Defined in

types.ts:11
