import { Module } from '@nestjs/common';
import { join } from 'path';
import { GraphQLFederationModule } from '../../../lib';
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
