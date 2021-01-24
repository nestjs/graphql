import { PubSub } from 'apollo-server-express';
import { Args, Query, Resolver, Subscription } from '../../../lib';
import { Notification } from './notification';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

export const pubSub = new PubSub();

@Resolver(() => Notification)
export class NotificationResolver {
  private readonly logger = new Logger(NotificationResolver.name);

  @Query(() => Notification)
  getNotification() {
    return {
      message: 'Hello!',
    };
  }

  @UseGuards(AuthGuard)
  @Subscription(() => Notification, {
    filter(payload, variables, context) {
      return (
        context.user === payload.newNotification.recipient &&
        payload.newNotification.id === variables.id
      );
    },
  })
  newNotification(
    @Args('id', {
      nullable: false,
    })
    id: string,
  ) {
    this.logger.log('User subscribed to newNotification');
    return pubSub.asyncIterator('newNotification');
  }
}
