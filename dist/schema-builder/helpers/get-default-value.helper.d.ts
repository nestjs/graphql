import { TypeOptions } from '../../interfaces/type-options.interface';
export declare function getDefaultValue<T = any>(
  instance: object,
  options: TypeOptions,
  key: string,
  typeName: string,
): T | undefined;
