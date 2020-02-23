import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../lib';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { User } from './user/user.entity';

@Module({
  imports: [
    UserModule,
    PostModule,
    GraphQLFederationModule.forRoot({
      debug: false,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [User],
      },
    }),
  ],
})
export class ApplicationModule {}
