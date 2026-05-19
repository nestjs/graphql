import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusFederationDriver } from '../../../lib/index.js';
import { ConfigModule } from './config/config.module.js';
import { ConfigService } from './config/config.service.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    GraphQLModule.forRootAsync({
      driver: MercuriusFederationDriver,
      useClass: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
