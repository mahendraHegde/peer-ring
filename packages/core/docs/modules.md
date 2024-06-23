[@peer-ring/core](README.md) / Exports

# @peer-ring/core

## Table of contents

### Enumerations

- [PredefinedCommandsEnum](enums/PredefinedCommandsEnum.md)

### Classes

- [Node](classes/Node.md)
- [PeerRing](classes/PeerRing.md)

### Interfaces

- [Command](interfaces/Command.md)
- [CommandBase](interfaces/CommandBase.md)
- [CommandDef](interfaces/CommandDef.md)
- [ExecuteOpts](interfaces/ExecuteOpts.md)
- [InetManager](interfaces/InetManager.md)
- [NetManagerOpts](interfaces/NetManagerOpts.md)
- [PeerRingOpts](interfaces/PeerRingOpts.md)

### Type Aliases

- [CommandHandler](modules.md#commandhandler)
- [LoggerOptType](modules.md#loggeropttype)

### Functions

- [buildLogger](modules.md#buildlogger)

## Type Aliases

### CommandHandler

Ƭ **CommandHandler**\<`T`\>: (`key`: [`Command`](interfaces/Command.md)[``"key"``], `payload`: [`Command`](interfaces/Command.md)[``"payload"``]) => `Promise`\<`undefined` \| [`Command`](interfaces/Command.md)\<`T`\>\> \| [`Command`](interfaces/Command.md)\<`T`\> \| `undefined`

#### Type parameters

| Name | Type                                                                      |
| :--- | :------------------------------------------------------------------------ |
| `T`  | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

#### Type declaration

▸ (`key`, `payload`): `Promise`\<`undefined` \| [`Command`](interfaces/Command.md)\<`T`\>\> \| [`Command`](interfaces/Command.md)\<`T`\> \| `undefined`

##### Parameters

| Name      | Type                                              |
| :-------- | :------------------------------------------------ |
| `key`     | [`Command`](interfaces/Command.md)[``"key"``]     |
| `payload` | [`Command`](interfaces/Command.md)[``"payload"``] |

##### Returns

`Promise`\<`undefined` \| [`Command`](interfaces/Command.md)\<`T`\>\> \| [`Command`](interfaces/Command.md)\<`T`\> \| `undefined`

#### Defined in

[core/src/types.ts:98](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L98)

---

### LoggerOptType

Ƭ **LoggerOptType**: `LoggerOptions` \| `pino.Logger`

#### Defined in

[core/src/types.ts:42](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L42)

## Functions

### buildLogger

▸ **buildLogger**(`loggerInstanceOrOpts?`, `bindings?`): `Logger`

#### Parameters

| Name                    | Type                                        |
| :---------------------- | :------------------------------------------ |
| `loggerInstanceOrOpts?` | [`LoggerOptType`](modules.md#loggeropttype) |
| `bindings?`             | `Bindings`                                  |

#### Returns

`Logger`

#### Defined in

[core/src/helpers/logger.ts:4](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/helpers/logger.ts#L4)
