import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib/graphql-federation.module';
import { UsersModule } from './users/users.module';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    GraphQLFederationModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        ...configService.createGqlOptions(),
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
