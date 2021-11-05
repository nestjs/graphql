import { Module } from '@nestjs/common';
import { join } from 'path';
import { GraphQLModule } from '../../lib';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync({
      useFactory: async () => ({
        typePaths: [join(__dirname, '**', '*.graphql')],
        useGlobalPrefix: true,
      }),
    }),
  ],
})
export class GlobalPrefixAsyncOptionsModule {}
