import { NullableList } from '../../interfaces';
export declare class DefaultNullableConflictError extends Error {
  constructor(
    hostTypeName: string,
    defaultVal: any,
    isNullable: boolean | NullableList,
  );
}
