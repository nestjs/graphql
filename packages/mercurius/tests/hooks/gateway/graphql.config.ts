import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusGatewayDriverConfig } from '../../../lib/interfaces/mercurius-gateway-driver-config.interface';

@Injectable()
export class GqlConfigService
  implements GqlOptionsFactory<MercuriusGatewayDriverConfig>
{
  private readonly logger = new Logger(GqlConfigService.name);

  public createGqlOptions(): MercuriusGatewayDriverConfig {
    return {
      gateway: {
        services: [
          {
            name: 'users',
            url: 'http://localhost:3011/graphql',
            schema: `
            type User @key(fields: "id") {
              id: ID!
              name: String!
            }
              
            extend type Query {
              getUser(id: ID!): User
            }
           `,
          },
          { name: 'posts', url: 'http://localhost:3012/graphql' },
        ],
        pollingInterval: 500,
      },
      hooks: {
        preGatewayExecution: (schema, document, context) => {
          this.logger.warn('preGatewayExecution');
          return { schema, document, context };
        },
        onGatewayReplaceSchema: (instance, schema) => {
          this.logger.warn('onGatewayReplaceSchema');
          return schema;
        },
      },
    };
  }
}
