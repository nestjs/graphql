import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { MercuriusDriverConfig, MercuriusFederationDriver } from '../../../lib';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      federationMetadata: true,
    }),
    UsersModule,
  ],
})
export class AppModule {}
