import 'reflect-metadata';
import { BaseTypeOptions, ReturnTypeFunc } from '../interfaces';
export interface SubscriptionOptions extends BaseTypeOptions {
  name?: string;
  description?: string;
  deprecationReason?: string;
  filter?: (
    payload: any,
    variables: any,
    context: any,
  ) => boolean | Promise<boolean>;
  resolve?: (
    payload: any,
    args: any,
    context: any,
    info: any,
  ) => any | Promise<any>;
}
export declare function Subscription(): MethodDecorator;
export declare function Subscription(name: string): MethodDecorator;
export declare function Subscription(
  name: string,
  options: Pick<SubscriptionOptions, 'filter' | 'resolve'>,
): MethodDecorator;
export declare function Subscription(
  typeFunc: ReturnTypeFunc,
  options?: SubscriptionOptions,
): MethodDecorator;
