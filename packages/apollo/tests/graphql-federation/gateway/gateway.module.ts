import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver } from '../../../lib/drivers';
import { supergraphSdl } from './supergraph-sdl';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloGatewayDriver,
      gateway: {
        debug: false,
        supergraphSdl,
      },
    }),
  ],
})
export class AppModule {}
