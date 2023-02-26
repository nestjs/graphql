// Old implementation of with-filter was leaking memory with was visible
// in case with long lived subscriptions where filter is skipping most of messages

import { $$asyncIterator } from 'iterall';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import {
  AsyncIterator,
  createAsyncIterator,
} from '../../lib/utils/async-iterator.util';

setFlagsFromString('--expose_gc');
const gc = runInNewContext('gc');

// https://github.com/apollographql/graphql-subscriptions/issues/212
it('does not leak memory with promise chain #memory', async function () {
  jest.setTimeout(5000);

  let stopped = false;
  let index = 0;
  const asyncIterator: AsyncIterator<any> = {
    async next() {
      if (stopped) {
        return Promise.resolve({ done: true, value: undefined });
      }
      index += 1;
      return new Promise((resolve) => setImmediate(resolve)).then(() => ({
        done: false,
        value: index,
      }));
    },
    return() {
      return Promise.resolve({ value: undefined, done: true });
    },
    throw(error) {
      return Promise.reject(error);
    },
    [$$asyncIterator]() {
      return this;
    },
  };

  const filteredAsyncIterator = await createAsyncIterator(
    Promise.resolve(asyncIterator),
    () => stopped,
  );

  gc();
  const heapUsed = process.memoryUsage().heapUsed;
  const nextPromise = filteredAsyncIterator.next();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  gc();
  const heapUsed2 = process.memoryUsage().heapUsed;
  stopped = true;
  await nextPromise;

  // Heap memory goes up for less than 1%
  expect(Math.max(0, heapUsed2 - heapUsed) / heapUsed).toBeLessThan(0.01);
});
