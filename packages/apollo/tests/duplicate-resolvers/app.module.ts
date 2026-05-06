import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloDriver } from '../../lib/index.js';
import { ModuleAModule } from './module-a/module-a.module.js';
import { ModuleBModule } from './module-b/module-b.module.js';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      typePaths: [join(import.meta.dirname, '*.graphql')],
    }),
    ModuleAModule,
    ModuleBModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
