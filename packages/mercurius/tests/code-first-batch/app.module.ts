import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '../../lib/drivers/index.js';
import { MercuriusDriverConfig } from '../../lib/index.js';
import { BlogService } from './blog.service.js';
import { PostsResolver } from './posts.resolver.js';

@Module({
  imports: [
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [BlogService, PostsResolver],
})
export class ApplicationModule {}
