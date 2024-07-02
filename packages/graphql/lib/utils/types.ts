export type Many<T> = T | readonly T[];
export type Lazy<T> = T | (() => T);
