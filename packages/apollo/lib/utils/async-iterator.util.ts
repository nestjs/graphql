import { $$asyncIterator } from 'iterall';

export type AsyncIterator<T> = {
  next(value?: any): Promise<IteratorResult<T>>;
  return(): any;
  throw(error: any): any;
  [$$asyncIterator]: any;
};

export const createAsyncIterator = async <T = any>(
  lazyFactory: Promise<AsyncIterator<T>>,
  filterFn: Function,
): Promise<AsyncIterator<T>> => {
  const asyncIterator = await lazyFactory;
  const getNextValue = () => {
    return new Promise<IteratorResult<any>>((resolve, reject) => {
      const inner = () => {
        if (!asyncIterator || typeof asyncIterator.next !== 'function') {
          reject(asyncIterator);
          return;
        }

        asyncIterator
          .next()
          .then((payload) => {
            if (payload.done === true) {
              resolve(payload);
              return;
            }
            Promise.resolve(filterFn(payload.value))
              .catch(() => false)
              .then((result) => {
                if (result === true) {
                  resolve(payload);
                  return;
                }

                inner();
                return;
              });
          })
          .catch(reject);
      };

      inner();
    });
  };

  return {
    next() {
      return getNextValue();
    },
    return() {
      const isAsyncIterator =
        asyncIterator && typeof asyncIterator.return === 'function';

      return isAsyncIterator
        ? asyncIterator.return()
        : Promise.resolve({
            done: true,
            value: asyncIterator,
          });
    },
    throw(error: any) {
      return asyncIterator.throw(error);
    },
    [$$asyncIterator]() {
      return this;
    },
  };
};
