export interface EnumMetadataValuesMapOptions {
  deprecationReason?: string;
  description?: string;
}

export type EnumMetadataValuesMap<T extends object> = Partial<
  Record<keyof T, EnumMetadataValuesMapOptions>
>;

export interface EnumMetadata<T extends object = any> {
  ref: T;
  name: string;
  description?: string;
  valuesMap?: EnumMetadataValuesMap<T>;
}
