import {
  ArgsType,
  InputType,
  InterfaceType,
  ObjectType,
} from '../decorators/index.js';

export type ClassDecoratorFactory =
  | typeof ArgsType
  | typeof ObjectType
  | typeof InterfaceType
  | typeof InputType;
