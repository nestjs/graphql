import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '@nestjs/graphql-experimental';
import { join } from 'path';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    UsersModule,
  ],
})
export class AppModule {}
