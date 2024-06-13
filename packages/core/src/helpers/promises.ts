//only wait for fastest `count` promises of all
export const promiseRaceWithCount = async <T>(
  promises: Array<Promise<T>>,
  count: number,
): Promise<{ results: Array<T>; errors: Error[] }> => {
  const results: Array<T> = [];
  const errors: Error[] = [];
  if (count <= 0) {
    return { results, errors };
  }
  let finishedCnt = 0;
  return new Promise((resolve) => {
    for (let promise of promises) {
      promise
        .then((res) => {
          results.push(res);
          if (results.length >= count) {
            //we got enough response, ignore errors, if any
            resolve({ results, errors: [] });
          }
        })
        .catch((err) => {
          errors.push(err);
        })
        .finally(() => {
          finishedCnt++;
          if (finishedCnt >= promises.length) {
            resolve({ results, errors });
          }
        });
    }
  });
};
