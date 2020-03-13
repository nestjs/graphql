import { Module } from '@nestjs/common';
import { GraphQLFederationModule } from '../../../lib';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { UsersModule } from './users/users.module';

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
