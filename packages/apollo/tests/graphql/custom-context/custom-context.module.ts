import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '../../../lib/index.js';
import { ApolloDriver } from '../../../lib/drivers/index.js';
import { CustomContextResolver } from './custom-context.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: (request) => ({
        foo: 'bar',
        request,
      }),
    }),
  ],
  providers: [CustomContextResolver],
})
export class CustomContextModule {}
