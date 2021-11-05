import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { ApolloGraphQLAdapter } from '../../lib/adapters';
import { CatsModule } from './cats/cats.module';
import { ConfigModule } from './config.module';
import { ConfigService } from './config.service';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync({
      adapter: ApolloGraphQLAdapter,
      imports: [ConfigModule],
      useExisting: ConfigService,
    }),
  ],
})
export class AsyncExistingApplicationModule {}
