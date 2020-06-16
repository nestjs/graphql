export interface EnumOptions {
  name: string;
  description?: string;
}
export declare function registerEnumType<T extends object = any>(
  enumRef: T,
  options: EnumOptions,
): void;
