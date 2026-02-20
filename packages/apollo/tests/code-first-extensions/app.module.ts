import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '../../lib';
import { UserModule } from './user/user.module';
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
