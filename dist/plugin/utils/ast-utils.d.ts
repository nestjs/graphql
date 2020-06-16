import {
  Decorator,
  Node,
  ObjectFlags,
  Type,
  TypeChecker,
  TypeFlags,
  TypeFormatFlags,
} from 'typescript';
export declare function isArray(type: Type): boolean;
export declare function getTypeArguments(type: Type): any;
export declare function isBoolean(type: Type): boolean;
export declare function isString(type: Type): boolean;
export declare function isNumber(type: Type): boolean;
export declare function isInterface(type: Type): boolean;
export declare function isEnum(type: Type): boolean;
export declare function isEnumLiteral(type: Type): boolean;
export declare function hasFlag(type: Type, flag: TypeFlags): boolean;
export declare function hasObjectFlag(type: Type, flag: ObjectFlags): boolean;
export declare function getText(
  type: Type,
  typeChecker: TypeChecker,
  enclosingNode?: Node,
  typeFormatFlags?: TypeFormatFlags,
): string;
export declare function getDefaultTypeFormatFlags(enclosingNode: Node): number;
export declare function getDecoratorArguments(
  decorator: Decorator,
): any[] | import('typescript').NodeArray<import('typescript').Expression>;
export declare function getDecoratorName(decorator: Decorator): string;
