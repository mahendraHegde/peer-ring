[@peer-ring/core](../README.md) / [Exports](../modules.md) / Command

# Interface: Command\<T\>

## Type parameters

| Name | Type                                                                      |
| :--- | :------------------------------------------------------------------------ |
| `T`  | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

## Hierarchy

- [`CommandBase`](CommandBase.md)

  ↳ **`Command`**

## Table of contents

### Properties

- [command](Command.md#command)
- [context](Command.md#context)
- [key](Command.md#key)
- [namespace](Command.md#namespace)
- [opts](Command.md#opts)
- [payload](Command.md#payload)

## Properties

### command

• **command**: `string`

#### Inherited from

[CommandBase](CommandBase.md).[command](CommandBase.md#command)

#### Defined in

[core/src/types.ts:107](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L107)

---

### context

• `Optional` **context**: `Object`

#### Type declaration

| Name                    | Type                                                                   |
| :---------------------- | :--------------------------------------------------------------------- |
| `peerResponses`         | \{ `errors`: `Error`[] ; `results`: [`Command`](Command.md)\<`T`\>[] } |
| `peerResponses.errors`  | `Error`[]                                                              |
| `peerResponses.results` | [`Command`](Command.md)\<`T`\>[]                                       |

#### Defined in

[core/src/types.ts:121](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L121)

---

### key

• **key**: `string`

#### Defined in

[core/src/types.ts:118](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L118)

---

### namespace

• **namespace**: `string`

#### Inherited from

[CommandBase](CommandBase.md).[namespace](CommandBase.md#namespace)

#### Defined in

[core/src/types.ts:106](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L106)

---

### opts

• `Optional` **opts**: [`ExecuteOpts`](ExecuteOpts.md)

#### Defined in

[core/src/types.ts:120](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L120)

---

### payload

• `Optional` **payload**: `T`

#### Defined in

[core/src/types.ts:119](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L119)
