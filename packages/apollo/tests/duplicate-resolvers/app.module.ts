import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ModuleAModule } from './module-a/module-a.module';
import { ModuleBModule } from './module-b/module-b.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      typePaths: [join(__dirname, '*.graphql')],
    }),
    ModuleAModule,
    ModuleBModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
