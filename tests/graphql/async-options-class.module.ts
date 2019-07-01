import { Module } from '@nestjs/common';
import { join } from 'path';
import { GqlModuleOptions, GqlOptionsFactory, GraphQLModule } from '../../lib';
import { CatsModule } from './cats/cats.module';

class ConfigService implements GqlOptionsFactory {
  createGqlOptions(): GqlModuleOptions {
    return {
      typePaths: [join(__dirname, '**', '*.graphql')],
    };
  }
}

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync({
      useClass: ConfigService,
    }),
  ],
})
export class AsyncClassApplicationModule {}
