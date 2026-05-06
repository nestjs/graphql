// this "shim" can be used on the frontend to prevent from errors on undefined
// decorators in the models, when you are sharing same models across backend and frontend.
// The package exposes it automatically via the "browser" and "react-native"
// conditional exports in package.json, so bundlers such as webpack, Metro or
// Vite will pick this file up when bundling for those environments without
// any additional configuration.
/* eslint @typescript-eslint/no-empty-function: 0 */
import {
  FieldOptions,
  InputTypeOptions,
  InterfaceTypeOptions,
  ObjectTypeOptions,
  ReturnTypeFunc,
} from '../index.js';
import * as typeFactories from '../type-factories/index.js';

// If the conditional export cannot be leveraged (older bundler, custom setup),
// the shim can still be aliased manually, for example with webpack:
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
  return (target: Function | object, key?: string | symbol) => {};
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
    prototype: object,
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
