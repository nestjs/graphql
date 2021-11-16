import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { MercuriusDriver, MercuriusDriverConfig } from '../../../lib';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      federationMetadata: true,
    }),
    UsersModule,
  ],
})
export class AppModule {}
