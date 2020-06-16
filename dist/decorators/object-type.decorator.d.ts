export interface ObjectTypeOptions {
  description?: string;
  isAbstract?: boolean;
  implements?: Function | Function[];
}
export declare function ObjectType(): ClassDecorator;
export declare function ObjectType(options: ObjectTypeOptions): ClassDecorator;
export declare function ObjectType(
  name: string,
  options?: ObjectTypeOptions,
): ClassDecorator;
