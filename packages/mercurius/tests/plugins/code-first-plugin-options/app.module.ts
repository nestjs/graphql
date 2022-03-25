import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib';
import { MercuriusDriver } from '../../../lib/drivers';
import { mockPlugin } from '../mocks/mock.plugin';
import { NEW_PLUGIN_URL } from '../mocks/utils/constants';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
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
