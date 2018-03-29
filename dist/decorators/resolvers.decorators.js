"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const graphql_constants_1 = require("../graphql.constants");
const resolvers_enum_1 = require("../enums/resolvers.enum");
function createResolverDecorator(resolver) {
  return name => (target, key, descriptor) => {
    common_1.ReflectMetadata(
      graphql_constants_1.RESOLVER_TYPE_METADATA,
      resolver || name
    )(target, key, descriptor);
    common_1.ReflectMetadata(graphql_constants_1.RESOLVER_NAME_METADATA, name)(
      target,
      key,
      descriptor
    );
  };
}
exports.createResolverDecorator = createResolverDecorator;
function createPropertyDecorator(propertyName) {
  return (target, key, descriptor) => {
    common_1.ReflectMetadata(
      graphql_constants_1.RESOLVER_NAME_METADATA,
      propertyName
    )(target, key, descriptor);
    common_1.ReflectMetadata(
      graphql_constants_1.RESOLVER_PROPERTY_METADATA,
      propertyName
    )(target, key, descriptor);
  };
}
exports.createPropertyDecorator = createPropertyDecorator;
function createDelegateDecorator(propertyName) {
  return (target, key, descriptor) => {
    common_1.ReflectMetadata(
      graphql_constants_1.RESOLVER_NAME_METADATA,
      propertyName
    )(target, key, descriptor);
    common_1.ReflectMetadata(
      graphql_constants_1.RESOLVER_DELEGATE_METADATA,
      propertyName
    )(target, key, descriptor);
  };
}
exports.createDelegateDecorator = createDelegateDecorator;
exports.Query = createResolverDecorator(resolvers_enum_1.Resolvers.QUERY);
exports.Mutation = createResolverDecorator(resolvers_enum_1.Resolvers.MUTATION);
exports.Subscription = createResolverDecorator(
  resolvers_enum_1.Resolvers.SUBSCRIPTION
);
exports.Resolver = createResolverDecorator();
exports.ResolveProperty = createPropertyDecorator;
exports.DelegateProperty = createDelegateDecorator;
