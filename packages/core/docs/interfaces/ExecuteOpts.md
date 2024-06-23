[@peer-ring/core](../README.md) / [Exports](../modules.md) / ExecuteOpts

# Interface: ExecuteOpts

## Table of contents

### Properties

- [forceExecuteOnCurrentNode](ExecuteOpts.md#forceexecuteoncurrentnode)
- [quorumCount](ExecuteOpts.md#quorumcount)
- [replicationFactor](ExecuteOpts.md#replicationfactor)

## Properties

### forceExecuteOnCurrentNode

• `Optional` **forceExecuteOnCurrentNode**: `boolean`

executes the command awlays on the current node, irrespective of the owner
Used internally only, while executing replicated requests

#### Defined in

[core/src/types.ts:143](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L143)

---

### quorumCount

• `Optional` **quorumCount**: `number`

specifies how many replicas to consult to achieve the quorum, must be less than or equal to [PeerRingOpts.replicationFactor](PeerRingOpts.md#replicationfactor)

**`Default Value`**

```ts
1;
```

#### Defined in

[core/src/types.ts:131](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L131)

---

### replicationFactor

• `Optional` **replicationFactor**: `number`

overrides [PeerRingOpts.replicationFactor](PeerRingOpts.md#replicationfactor),
if you provide this for a key.it is your responsibility to provide the same value for all operations for the choosen key.
i.e giving factor of 1 for writes and 3 for reads would result in no quorum, and unncesary network calls

#### Defined in

[core/src/types.ts:137](https://github.com/mahendraHegde/peer-ring/blob/a34a79cc00dcfece3dd7053087438426a58bff61/packages/core/src/types.ts#L137)
