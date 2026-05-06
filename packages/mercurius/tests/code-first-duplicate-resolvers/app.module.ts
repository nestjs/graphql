import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { ModuleAModule } from './module-a/module-a.module.js';
import { ModuleBModule } from './module-b/module-b.module.js';
import { QueryResolver } from './query.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
    }),
    ModuleAModule,
    ModuleBModule,
    QueryResolver,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
