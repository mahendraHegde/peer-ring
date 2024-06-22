export function* getBatchedKeys<T, U>(
  map: Map<T, U>,
  batchSize: number = 50,
): Generator<T[]> {
  const iterator = map.keys();
  let batch: T[] = [];

  for (let key of iterator) {
    batch.push(key);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  }

  // Yield the remaining keys if any
  if (batch.length > 0) {
    yield batch;
  }
}
