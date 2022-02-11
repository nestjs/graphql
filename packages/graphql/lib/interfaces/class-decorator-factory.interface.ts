import { ArgsType, InputType, InterfaceType, ObjectType } from '../decorators';

export type ClassDecoratorFactory =
  | typeof ArgsType
  | typeof ObjectType
  | typeof InterfaceType
  | typeof InputType;
