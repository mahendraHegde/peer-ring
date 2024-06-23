[@peer-ring/core](../README.md) / [Exports](../modules.md) / PeerRing

# Class: PeerRing

## Table of contents

### Constructors

- [constructor](PeerRing.md#constructor)

### Properties

- [\_opts](PeerRing.md#_opts)
- [commands](PeerRing.md#commands)
- [nodes](PeerRing.md#nodes)
- [opts](PeerRing.md#opts)

### Methods

- [execute](PeerRing.md#execute)
- [initRing](PeerRing.md#initring)
- [isAReplica](PeerRing.md#isareplica)
- [onPeerAdded](PeerRing.md#onpeeradded)
- [onPeerRemoved](PeerRing.md#onpeerremoved)
- [registerCommand](PeerRing.md#registercommand)
- [stop](PeerRing.md#stop)

## Constructors

### constructor

• **new PeerRing**(`opts`): [`PeerRing`](PeerRing.md)

#### Parameters

| Name   | Type                                            |
| :----- | :---------------------------------------------- |
| `opts` | [`PeerRingOpts`](../interfaces/PeerRingOpts.md) |

#### Returns

[`PeerRing`](PeerRing.md)

#### Defined in

[core/src/peer-ring.ts:32](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L32)

## Properties

### \_opts

• **\_opts**: `Required`\<`Omit`\<[`PeerRingOpts`](../interfaces/PeerRingOpts.md), `"logger"` \| `"netManagerOpts"` \| `"netManager"`\>\>

#### Defined in

[core/src/peer-ring.ts:22](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L22)

---

### commands

• **commands**: `Record`\<`string`, [`CommandHandler`](../modules.md#commandhandler)\> = `{}`

#### Defined in

[core/src/peer-ring.ts:21](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L21)

---

### nodes

• **nodes**: [`Node`](Node.md)[] = `[]`

#### Defined in

[core/src/peer-ring.ts:20](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L20)

---

### opts

• `Readonly` **opts**: [`PeerRingOpts`](../interfaces/PeerRingOpts.md)

#### Defined in

[core/src/peer-ring.ts:32](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L32)

## Methods

### execute

▸ **execute**\<`T`\>(`command`): `Promise`\<`undefined` \| [`Command`](../interfaces/Command.md)\<`T`\>\>

#### Type parameters

| Name | Type                                    |
| :--- | :-------------------------------------- |
| `T`  | extends `Record`\<`string`, `unknown`\> |

#### Parameters

| Name      | Type                                                                     |
| :-------- | :----------------------------------------------------------------------- |
| `command` | [`Command`](../interfaces/Command.md)\<`Record`\<`string`, `unknown`\>\> |

#### Returns

`Promise`\<`undefined` \| [`Command`](../interfaces/Command.md)\<`T`\>\>

#### Defined in

[core/src/peer-ring.ts:240](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L240)

---

### initRing

▸ **initRing**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[core/src/peer-ring.ts:206](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L206)

---

### isAReplica

▸ **isAReplica**(`targetNodes`): `boolean`

#### Parameters

| Name          | Type                |
| :------------ | :------------------ |
| `targetNodes` | [`Node`](Node.md)[] |

#### Returns

`boolean`

#### Defined in

[core/src/peer-ring.ts:236](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L236)

---

### onPeerAdded

▸ **onPeerAdded**(`peer`): `void`

#### Parameters

| Name   | Type   |
| :----- | :----- |
| `peer` | `Peer` |

#### Returns

`void`

#### Defined in

[core/src/peer-ring.ts:198](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L198)

---

### onPeerRemoved

▸ **onPeerRemoved**(`peer`): `void`

#### Parameters

| Name   | Type   |
| :----- | :----- |
| `peer` | `Peer` |

#### Returns

`void`

#### Defined in

[core/src/peer-ring.ts:202](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L202)

---

### registerCommand

▸ **registerCommand**\<`T`\>(`def`): `void`

#### Type parameters

| Name | Type                                                                      |
| :--- | :------------------------------------------------------------------------ |
| `T`  | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

#### Parameters

| Name  | Type                                               |
| :---- | :------------------------------------------------- |
| `def` | [`CommandDef`](../interfaces/CommandDef.md)\<`T`\> |

#### Returns

`void`

#### Defined in

[core/src/peer-ring.ts:230](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L230)

---

### stop

▸ **stop**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[core/src/peer-ring.ts:342](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/peer-ring.ts#L342)
