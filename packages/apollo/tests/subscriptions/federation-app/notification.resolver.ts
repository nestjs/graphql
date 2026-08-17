import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Notification } from './notification.js';

export const pubSub = new PubSub();

@Resolver(() => Notification)
export class NotificationResolver {
  @Query(() => Notification)
  getFederatedNotification(): Notification {
    return { id: '0', recipient: 'system', message: 'ok' };
  }

  @Subscription(() => Notification, {
    filter(payload, variables) {
      return (
        payload.newFederatedNotification.id === variables.id &&
        payload.newFederatedNotification.recipient === variables.recipient
      );
    },
  })
  newFederatedNotification(
    @Args('id', { nullable: false }) id: string,
    @Args('recipient', { nullable: false }) recipient: string,
  ) {
    return pubSub.asyncIterableIterator('newFederatedNotification');
  }
}
