import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib/index.js';
import { MercuriusDriver } from '../../../lib/drivers/index.js';
import { mockPlugin } from '../mocks/mock.plugin.js';
import { NEW_PLUGIN_URL } from '../mocks/utils/constants.js';
import { DogsModule } from './dogs/dogs.module.js';

@Module({
  imports: [
    DogsModule,
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      plugins: [
        {
          plugin: mockPlugin,
          options: {
            url: NEW_PLUGIN_URL,
          },
        },
      ],
    }),
  ],
})
export class ApplicationModule {}
