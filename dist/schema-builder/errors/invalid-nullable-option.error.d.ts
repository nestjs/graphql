import { NullableList } from '../../interfaces';
export declare class InvalidNullableOptionError extends Error {
  constructor(name: string, nullable?: boolean | NullableList);
}
