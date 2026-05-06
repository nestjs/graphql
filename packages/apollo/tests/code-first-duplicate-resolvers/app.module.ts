import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '../../lib/index.js';
import { ModuleAModule } from './module-a/module-a.module.js';
import { ModuleBModule } from './module-b/module-b.module.js';
import { QueryResolver } from './query.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
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
