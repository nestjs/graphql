import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib/graphql-federation.module';
import { UsersModule } from './users/users.module';
import { join } from 'path';

@Module({
  imports: [
    GraphQLFederationModule.forRoot({
      typePaths: [join(__dirname, '**/*.graphql')],
    }),
    UsersModule,
  ],
})
export class AppModule {}
