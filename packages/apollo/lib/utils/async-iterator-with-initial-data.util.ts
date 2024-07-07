export const createIteratorWithInitialData = <T = any>(
  iterator: AsyncIterator<T, any, undefined>,
  initialData: T[],
): AsyncIterableIterator<T> => {
  return (async function* () {
    for (const data of initialData) {
      yield data;
    }
    while (true) {
      const { value, done } = await iterator.next();
      if (done) {
        break;
      }
      yield value;
    }
  })();
};
