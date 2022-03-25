import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusFederationDriver,
} from '../../../../lib';
import { mockPlugin } from '../../mocks/mock.plugin';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [join(__dirname, '**/*.graphql')],
      federationMetadata: true,
      plugins: [
        {
          plugin: mockPlugin,
        },
      ],
    }),
    UsersModule,
  ],
})
export class AppModule {}
