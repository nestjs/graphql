import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../lib';
import { MercuriusDriver } from '../../lib/drivers';
import { ModuleAModule } from './module-a/module-a.module';
import { ModuleBModule } from './module-b/module-b.module';
import { QueryResolver } from './query.resolver';

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
