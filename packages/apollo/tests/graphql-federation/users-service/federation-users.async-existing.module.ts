import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '@nestjs/graphql-experimental';
import { ApolloFederationGraphQLAdapter } from '../../../lib/adapters';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLFederationModule.forRootAsync({
      adapter: ApolloFederationGraphQLAdapter,
      useExisting: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
