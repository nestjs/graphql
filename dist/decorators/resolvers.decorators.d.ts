import { Resolvers } from '../enums/resolvers.enum';
export declare function createResolverDecorator(
  resolver?: Resolvers | string,
): (name?: string) => any;
export declare function createPropertyDecorator(
  propertyName?: string,
): MethodDecorator;
export declare function createDelegateDecorator(
  propertyName?: string,
): MethodDecorator;
export declare function Scalar(name: string): ClassDecorator;
export declare const Query: (name?: string) => any;
export declare const Mutation: (name?: string) => any;
export declare const Subscription: (name?: string) => any;
export declare const Resolver: (name?: string) => any;
export declare const ResolveProperty: typeof createPropertyDecorator;
export declare const DelegateProperty: typeof createDelegateDecorator;
