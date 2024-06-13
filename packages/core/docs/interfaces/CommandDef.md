[@peer-ring/core](../README.md) / [Exports](../modules.md) / CommandDef

# Interface: CommandDef\<T\>

## Type parameters

| Name | Type                                                                      |
| :--- | :------------------------------------------------------------------------ |
| `T`  | extends `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\> |

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

core/src/types.ts:107

---

### handler

• **handler**: [`CommandHandler`](../modules.md#commandhandler)\<`T`\>

#### Defined in

core/src/types.ts:112

---

### namespace

• **namespace**: `string`

#### Inherited from

[CommandBase](CommandBase.md).[namespace](CommandBase.md#namespace)

#### Defined in

core/src/types.ts:106
