import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib/graphql-federation.module';
import { UsersModule } from './users/users.module';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    GraphQLFederationModule.forRootAsync({
      useClass: ConfigService,
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
