import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import {
  MercuriusFederationDriver,
  MercuriusFederationDriverConfig,
} from '../../../../lib/index.js';
import { UsersModule } from '../../../graphql-federation/users-service/users/users.module.js';
import { mockPlugin } from '../../mocks/mock.plugin.js';
import { NEW_PLUGIN_URL } from '../../mocks/utils/constants.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusFederationDriverConfig>({
      driver: MercuriusFederationDriver,
      typePaths: [
        join(
          import.meta.dirname,
          '../../../graphql-federation/users-service',
          '**/*.graphql',
        ),
      ],
      plugins: [
        {
          plugin: mockPlugin,
          options: {
            url: NEW_PLUGIN_URL,
          },
        } as any,
      ],
    }),
    UsersModule,
  ],
})
export class AppModule {}
