import { createIteratorWithInitialData } from '../../lib/utils/async-iterator-with-initial-data.util';

it('Should serve initial data followed by live upates', async () => {
  const initialData: Array<number> = [1, 2, 3];
  const asyncIterator = async function* () {
    yield 4;
  };
  const iterator = await createIteratorWithInitialData<number>(
    asyncIterator(),
    initialData,
  );
  const result: Array<number> = [];
  for await (const value of iterator) {
    result.push(value);
  }
  expect(result).toEqual([1, 2, 3, 4]);
});
