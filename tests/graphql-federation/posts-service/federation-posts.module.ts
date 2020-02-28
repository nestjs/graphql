import { Module } from '@nestjs/common';
import { join } from 'path';
import { GraphQLFederationModule } from '../../../lib';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    PostsModule,
  ],
})
export class AppModule {}
