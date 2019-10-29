import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib/graphql-federation.module';
import { PostsModule } from './posts/posts.module';
import { join } from 'path';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    PostsModule,
  ],
})
export class AppModule {}
