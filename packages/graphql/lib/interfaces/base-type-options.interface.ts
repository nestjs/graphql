export type NullableList = 'items' | 'itemsAndList';
export interface BaseTypeOptions {
  /**
   * Determines whether field/argument/etc is nullable.
   */
  nullable?: boolean | NullableList;
  /**
   * Default value.
   */
  defaultValue?: any;
}
