import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
import { Injectable } from '@nestjs/common';
import { GqlModuleOptions } from '@nestjs/graphql-experimental/interfaces';
import { ApolloGraphQLBaseAdapter } from './apollo-graphql-base.adapter';

@Injectable()
export class ApolloFederationGraphQLAdapter extends ApolloGraphQLBaseAdapter {
  public async runPreOptionsHooks(apolloOptions: GqlModuleOptions) {
    await this.runExecutorFactoryIfPresent(apolloOptions);
  }

  protected async registerExpress(apolloOptions: GqlModuleOptions) {
    return super.registerExpress(apolloOptions, {
      preStartHook: () => {
        // If custom directives are provided merge them into schema per Apollo
        // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
        if (apolloOptions.schemaDirectives) {
          SchemaDirectiveVisitor.visitSchemaDirectives(
            apolloOptions.schema,
            apolloOptions.schemaDirectives,
          );
        }
      },
    });
  }

  protected async registerFastify(apolloOptions: GqlModuleOptions) {
    return super.registerFastify(apolloOptions, {
      preStartHook: () => {
        // If custom directives are provided merge them into schema per Apollo
        // https://www.apollographql.com/docs/apollo-server/federation/implementing-services/#defining-custom-directives
        if (apolloOptions.schemaDirectives) {
          SchemaDirectiveVisitor.visitSchemaDirectives(
            apolloOptions.schema,
            apolloOptions.schemaDirectives,
          );
        }
      },
    });
  }

  private async runExecutorFactoryIfPresent(apolloOptions: GqlModuleOptions) {
    if (!apolloOptions.executorFactory) {
      return;
    }
    const executor = await apolloOptions.executorFactory(apolloOptions.schema);
    apolloOptions.executor = executor;
  }
}
