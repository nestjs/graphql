import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../lib';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { User } from './user/user.entity';
import { RecipeModule } from './recipe/recipe.module';

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
