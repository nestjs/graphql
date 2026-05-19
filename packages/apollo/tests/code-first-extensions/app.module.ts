import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';
import { UserModule } from './user/user.module.js';
import { Module } from '@nestjs/common';

/**
 * Main application module for the code-first extensions example.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
    }),
    UserModule,
  ],
})
export class AppModule {}
