import { Module } from '@nestjs/common';
import { join } from 'path';
import { GraphQLFederationModule } from '../../../lib';
import { PostsModule } from './posts/posts.module';
import { UpperCaseDirective } from './posts/upper.directive';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: [join(__dirname, '**/*.graphql')],
      schemaDirectives: {
        upper: UpperCaseDirective,
      },
    }),
    PostsModule,
  ],
})
export class AppModule {}
