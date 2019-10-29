import { Module } from '@nestjs/common';
import { GraphQLGatewayModule } from '../../../lib/graphql-gateway.module';

@Module({
  imports: [
    GraphQLGatewayModule.forRoot({
      serviceList: [
        { name: 'users', url: 'http://localhost:3001/graphql' },
        { name: 'posts', url: 'http://localhost:3002/graphql' },
      ],
    }),
  ],
})
export class AppModule {}
