[@peer-ring/core](../README.md) / [Exports](../modules.md) / NetManagerOpts

# Interface: NetManagerOpts

## Table of contents

### Properties

- [logger](NetManagerOpts.md#logger)
- [port](NetManagerOpts.md#port)
- [requestTimeout](NetManagerOpts.md#requesttimeout)

## Properties

### logger

• `Optional` **logger**: [`LoggerOptType`](../modules.md#loggeropttype)

pino instance or options

#### Defined in

core/src/types.ts:63

---

### port

• `Optional` **port**: `number`

RPC port for inter peer communication

**`Default Value`**

```ts
4444;
```

#### Defined in

core/src/types.ts:54

---

### requestTimeout

• `Optional` **requestTimeout**: `number`

timeout value in milliseconds for rpc req/response

**`Default Value`**

```ts
2000;
```

#### Defined in

core/src/types.ts:59
