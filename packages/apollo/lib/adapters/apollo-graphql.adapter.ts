import { Injectable } from '@nestjs/common';
import { GqlModuleOptions } from '@nestjs/graphql-experimental';
import { ApolloGraphQLBaseAdapter } from './apollo-graphql-base.adapter';

@Injectable()
export class ApolloGraphQLAdapter extends ApolloGraphQLBaseAdapter {
  public async start(apolloOptions: GqlModuleOptions) {
    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName === 'express') {
      await this.registerExpress(apolloOptions);
    } else if (platformName === 'fastify') {
      await this.registerFastify(apolloOptions);
    } else {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
  }
}
