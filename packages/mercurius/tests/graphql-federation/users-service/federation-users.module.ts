import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../lib';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    UsersModule,
  ],
})
export class AppModule {}
