// this "shim" can be used on the frontend to prevent from errors on undefined
// decorators in the models, when you are sharing same models across backend and frontend.
// to use this shim simply configure your webpack configuration to use this file instead of @nestjs/graphql module.
/* eslint @typescript-eslint/no-empty-function: 0 */
import {
  FieldOptions,
  InputTypeOptions,
  InterfaceTypeOptions,
  ObjectTypeOptions,
  ReturnTypeFunc,
} from '..';
import * as typeFactories from '../type-factories';

// for webpack this is resolved this way:
// resolve: { // see: https://webpack.js.org/configuration/resolve/
//     alias: {
//         @nestjs/graphql: path.resolve(__dirname, "../node_modules/@nestjs/graphql/dist/extra/graphql-model-shim")
//     }
// }

export function ArgsType(): ClassDecorator {
  return (target: Function) => {};
}

export function Directive(
  sdl: string,
): MethodDecorator & PropertyDecorator & ClassDecorator {
  return (target: Function | Object, key?: string | symbol) => {};
}

export function Extensions(
  value: Record<string, unknown>,
): MethodDecorator & ClassDecorator & PropertyDecorator {
  return (target: Function | object, propertyKey?: string | symbol) => {};
}

export function Field(
  typeOrOptions?: ReturnTypeFunc | FieldOptions,
  fieldOptions?: FieldOptions,
): PropertyDecorator & MethodDecorator {
  return (
    prototype: Object,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {};
}

export function HideField(): PropertyDecorator {
  return (target: Record<string, any>, propertyKey: string | symbol) => {};
}

export function InputType(
  nameOrOptions?: string | InputTypeOptions,
  inputTypeOptions?: InputTypeOptions,
): ClassDecorator {
  return (target) => {};
}

export function InterfaceType(
  nameOrOptions?: string | InterfaceTypeOptions,
  interfaceOptions?: InterfaceTypeOptions,
): ClassDecorator {
  return (target) => {};
}

export function ObjectType(
  nameOrOptions?: string | ObjectTypeOptions,
  objectTypeOptions?: ObjectTypeOptions,
): ClassDecorator {
  return (target) => {};
}

export function Scalar(
  name: string,
  typeFunc?: ReturnTypeFunc,
): ClassDecorator {
  return (target, key?, descriptor?) => {};
}

export function dummyFn() {
  return;
}

export const createUnionType: typeof typeFactories.createUnionType =
  dummyFn as any;
export const registerEnumType: typeof typeFactories.registerEnumType = dummyFn;
