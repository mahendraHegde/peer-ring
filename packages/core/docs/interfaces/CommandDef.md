[@peer-ring/core](../README.md) / [Exports](../modules.md) / CommandDef

# Interface: CommandDef\<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

## Hierarchy

- [`CommandBase`](CommandBase.md)

  ↳ **`CommandDef`**

## Table of contents

### Properties

- [command](CommandDef.md#command)
- [handler](CommandDef.md#handler)
- [namespace](CommandDef.md#namespace)

## Properties

### command

• **command**: `string`

#### Inherited from

[CommandBase](CommandBase.md).[command](CommandBase.md#command)

#### Defined in

[core/src/types.ts:107](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L107)

___

### handler

• **handler**: [`CommandHandler`](../modules.md#commandhandler)\<`T`\>

#### Defined in

[core/src/types.ts:112](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L112)

___

### namespace

• **namespace**: `string`

#### Inherited from

[CommandBase](CommandBase.md).[namespace](CommandBase.md#namespace)

#### Defined in

[core/src/types.ts:106](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L106)
