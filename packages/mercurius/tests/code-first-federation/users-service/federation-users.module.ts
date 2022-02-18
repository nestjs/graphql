import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig, MercuriusFederationDriver } from '../../../lib';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      autoSchemaFile: true,
      federationMetadata: true,
    }),
    UserModule,
  ],
})
export class AppModule {}
