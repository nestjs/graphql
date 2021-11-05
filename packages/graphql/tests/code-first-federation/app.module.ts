import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../lib';
import { PostModule } from './post/post.module';
import { RecipeModule } from './recipe/recipe.module';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    RecipeModule,
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
