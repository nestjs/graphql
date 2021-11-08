import { Injectable } from '@nestjs/common';
import { GqlModuleOptions } from '@nestjs/graphql-experimental/interfaces';
import { ApolloGraphQLBaseAdapter } from './apollo-graphql-base.adapter';

@Injectable()
export class ApolloGatewayGraphQLAdapter extends ApolloGraphQLBaseAdapter {
  public async runPreOptionsHooks(apolloOptions: GqlModuleOptions) {
    await this.runExecutorFactoryIfPresent(apolloOptions);
  }

  private async runExecutorFactoryIfPresent(apolloOptions: GqlModuleOptions) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
