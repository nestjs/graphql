import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../lib/index.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(import.meta.dirname, '**/*.graphql')],
    }),
    UsersModule,
  ],
})
export class AppModule {}
