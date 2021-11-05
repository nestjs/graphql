import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloGraphQLDriverAdapter } from '../../lib/adapters';
import { CatsModule } from './cats/cats.module';
import { ConfigModule } from './config.module';
import { ConfigService } from './config.service';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync({
      adapter: ApolloGraphQLDriverAdapter,
      imports: [ConfigModule],
      useExisting: ConfigService,
    }),
  ],
})
export class AsyncExistingApplicationModule {}
