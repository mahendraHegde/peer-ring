[@peer-ring/core](../README.md) / [Exports](../modules.md) / InetManager

# Interface: InetManager

## Table of contents

### Properties

- [onMessage](InetManager.md#onmessage)
- [sendMessage](InetManager.md#sendmessage)
- [setIp](InetManager.md#setip)
- [start](InetManager.md#start)
- [stop](InetManager.md#stop)

## Properties

### onMessage

• **onMessage**: (`callback`: (`command`: [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\>) => `undefined` \| [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\> \| `Promise`\<`undefined` \| [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\>\>) => `void`

#### Type declaration

▸ (`callback`): `void`

##### Parameters

| Name       | Type                                                                                                                                                                                                                                           | Description                                      |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| `callback` | (`command`: [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\>) => `undefined` \| [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\> \| `Promise`\<`undefined` \| [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\>\> | is called when the message is received by a peer |

##### Returns

`void`

#### Defined in

core/src/types.ts:16

---

### sendMessage

• **sendMessage**: \<T\>(`ip`: `string`, `command`: [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\>) => `Promise`\<[`Command`](Command.md)\<`T`\>\>

called by the ring manager to communicate commands to peers

#### Type declaration

▸ \<`T`\>(`ip`, `command`): `Promise`\<[`Command`](Command.md)\<`T`\>\>

##### Type parameters

| Name | Type                                                                      |
| :--- | :------------------------------------------------------------------------ |
| `T`  | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

##### Parameters

| Name      | Type                                                       | Description                |
| :-------- | :--------------------------------------------------------- | :------------------------- |
| `ip`      | `string`                                                   | ip of the destination peer |
| `command` | [`Command`](Command.md)\<`Record`\<`string`, `unknown`\>\> | command to send            |

##### Returns

`Promise`\<[`Command`](Command.md)\<`T`\>\>

#### Defined in

core/src/types.ts:27

---

### setIp

• `Optional` **setIp**: (`ip`: `string`) => `void`

optional method called by the ring manager, when present to set the node's ip

#### Type declaration

▸ (`ip`): `void`

##### Parameters

| Name | Type     | Description            |
| :--- | :------- | :--------------------- |
| `ip` | `string` | ip of the current node |

##### Returns

`void`

#### Defined in

core/src/types.ts:37

---

### start

• **start**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

core/src/types.ts:31

---

### stop

• `Optional` **stop**: () => `Promise`\<`void`\>

#### Type declaration

▸ (): `Promise`\<`void`\>

##### Returns

`Promise`\<`void`\>

#### Defined in

core/src/types.ts:39
