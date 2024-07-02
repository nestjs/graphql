export const createIteratorWithInitialData = async <T = any>(
  iterator: AsyncIterator<T>,
  initialData: T[],
): Promise<AsyncIterableIterator<T>> => {
  return (async function* () {
    for (const data of initialData) {
      yield data;
    }
    while (true) {
      const entry = await iterator.next();
      if (entry.done) {
        return;
      }
      yield entry.value;
    }
  })();
};
