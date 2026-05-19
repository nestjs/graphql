import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../lib/index.js';
import { PostModule } from './posts/post.module.js';
import { UserModule } from './users/user.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
    }),
    UserModule,
    PostModule,
  ],
})
export class AppModule {}
