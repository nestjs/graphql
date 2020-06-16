declare type AsyncIterator<T> = {
  next(value?: any): Promise<IteratorResult<T>>;
  return(): any;
  throw(error: any): any;
};
export declare const createAsyncIterator: <T = any>(
  lazyFactory: Promise<AsyncIterator<T>>,
  filterFn: Function,
) => Promise<AsyncIterator<T>>;
export {};
