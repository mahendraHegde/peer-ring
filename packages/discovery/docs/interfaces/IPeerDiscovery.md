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

[types.ts:8](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L8)

---

### initDiscovery

• `Optional` **initDiscovery**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

[types.ts:13](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L13)

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

[types.ts:9](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L9)

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

[types.ts:10](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L10)

---

### stop

• `Optional` **stop**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

[types.ts:12](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L12)

---

### whoAmI

• **whoAmI**: () => [`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

#### Type declaration

▸ (): [`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

##### Returns

[`Peer`](../classes/Peer.md) \| `Promise`\<[`Peer`](../classes/Peer.md)\>

#### Defined in

[types.ts:11](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/discovery/src/types.ts#L11)
