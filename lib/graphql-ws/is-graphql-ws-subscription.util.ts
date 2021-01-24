import {
  GraphQLWsSubscriptionsConfig,
  SubscriptionConfig,
} from '../interfaces/gql-module-options.interface';

export function isGraphQLWSSubscriptionConfig(
  options?: SubscriptionConfig,
): options is GraphQLWsSubscriptionsConfig {
  return (
    !!options &&
    'protocol' in (options as any) &&
    (options as any).protocol === 'graphql-ws'
  );
}
