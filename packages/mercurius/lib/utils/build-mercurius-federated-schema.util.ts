import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { transformSchema } from '@nestjs/graphql';
import { BuildFederatedSchemaOptions } from '@nestjs/graphql';
import { GraphQLSchema, isObjectType } from 'graphql';
import { forEach } from 'lodash';

export function buildMercuriusFederatedSchema({
  typeDefs,
  resolvers,
}: BuildFederatedSchemaOptions) {
  const { buildSubgraphSchema } = loadPackage(
    '@apollo/subgraph',
    'MercuriusFederation',
    () => require('@apollo/subgraph'),
  );
  let executableSchema: GraphQLSchema = buildSubgraphSchema({
    typeDefs,
    resolvers,
  });

  const subscriptionResolvers = resolvers.Subscription;
  // if no Subscriptions are defined, this is undefined
  executableSchema = transformSchema(executableSchema, (type) => {
    if (isObjectType(type)) {
      const isSubscription = type.name === 'Subscription';
      forEach(type.getFields(), (value, key) => {
        if (isSubscription) {
          const resolver = subscriptionResolvers[key];
          if (resolver && !value.subscribe) {
            value.subscribe = resolver.subscribe;
          }
        }
      });
    }
    return type;
  });

  return executableSchema;
}
