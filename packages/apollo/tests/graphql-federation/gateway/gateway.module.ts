import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver } from '../../../lib/drivers/index.js';
import { supergraphSdl } from './supergraph-sdl.js';

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloGatewayDriver,
      gateway: {
        includeStacktraceInErrorResponses: false,
        supergraphSdl,
      },
    }),
  ],
})
export class AppModule {}
