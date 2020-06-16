import { ArgsType, InputType, InterfaceType, ObjectType } from '../decorators';
export declare type ClassDecoratorFactory =
  | typeof ArgsType
  | typeof ObjectType
  | typeof InterfaceType
  | typeof InputType;
