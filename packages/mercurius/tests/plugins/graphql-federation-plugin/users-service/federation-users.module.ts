import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusDriverConfig,
  MercuriusFederationDriver,
} from '../../../../lib';
import { UsersModule } from '../../../graphql-federation/users-service/users/users.module';
import { mockPlugin } from '../../mocks/mock.plugin';
import { NEW_PLUGIN_URL } from '../../mocks/utils/constants';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [
        join(
          __dirname,
          '../../../graphql-federation/users-service',
          '**/*.graphql',
        ),
      ],
      federationMetadata: true,
      plugins: [
        {
          plugin: mockPlugin,
          options: {
            url: NEW_PLUGIN_URL,
          },
        },
      ],
    }),
    UsersModule,
  ],
})
export class AppModule {}
