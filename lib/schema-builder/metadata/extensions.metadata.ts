export interface ExtensionsMetadata {
  target: Function;
  value: Record<string, unknown>;
}

export type ClassExtensionsMetadata = ExtensionsMetadata;

export interface PropertyExtensionsMetadata extends ExtensionsMetadata {
  fieldName: string;
}
