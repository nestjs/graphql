import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib';
import { UsersNicknameModule } from './users-nickname/users-nickname.module';

@Module({
  imports: [
    UsersNicknameModule,
    GraphQLFederationModule.forRoot({
      autoSchemaFile: true,
    }),
  ],
})
export class AppModule {}
