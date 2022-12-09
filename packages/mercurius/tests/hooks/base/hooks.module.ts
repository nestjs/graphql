import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '../../../lib/drivers';
import { MercuriusDriverConfig } from '../../../lib/interfaces/mercurius-driver-config.interface';
import { CatsModule } from '../cats/cats.module';
import { GqlConfigService } from './graphql.config';

@Module({
  imports: [
    CatsModule,
    GraphQLModule.forRootAsync<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      useClass: GqlConfigService,
    }),
  ],
})
export class ApplicationModule {}
