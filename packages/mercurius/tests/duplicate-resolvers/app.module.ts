import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { ModuleAModule } from './module-a/module-a.module.js';
import { ModuleBModule } from './module-b/module-b.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      typePaths: [join(import.meta.dirname, '*.graphql')],
    }),
    ModuleAModule,
    ModuleBModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
