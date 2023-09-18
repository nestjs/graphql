export type NullableList = 'items' | 'itemsAndList';

type NonNullableBaseType<T = any> = {
  /**
   * Determines whether field/argument/etc is nullable.
   */
  nullable?: false | NullableList;
  /**
   * Default value.
   */
  defaultValue?: T;
};

type NullableBaseType<T = any> = {
  /**
   * Determines whether field/argument/etc is nullable.
   */
  nullable: true;
  /**
   * Default value.
   */
  defaultValue?: T | null;
};

export type BaseTypeOptions<T = any> =
  | NonNullableBaseType<T>
  | NullableBaseType<T>;
