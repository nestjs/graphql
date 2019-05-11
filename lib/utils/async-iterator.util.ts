import { $$asyncIterator } from 'iterall';

type AsyncIterator<T> = {
  next(value?: any): Promise<IteratorResult<T>>;
};

export const createAsyncIterator = async <T = any>(
  lazyFactory: Promise<AsyncIterator<T>>,
  filterFn: Function,
): Promise<AsyncIterator<T>> => {
  const asyncIterator = await lazyFactory;
  const getNextValue = async () => {
    const payload = await asyncIterator.next();
    if (payload.done === true) {
      return payload;
    }
    return Promise.resolve(filterFn(payload.value))
      .catch(() => false)
      .then(result => (result ? payload : getNextValue()));
  };

  return {
    next() {
      return getNextValue();
    },
    [$$asyncIterator]() {
      return this;
    },
  };
};
