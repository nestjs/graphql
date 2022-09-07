import { Injectable, Logger } from '@nestjs/common';
import { FederationConfig, FederationVersion } from '../interfaces';
import { TypeDefsFederation2Decorator } from './type-defs-federation2.decorator';

export interface TypeDefsDecorator<T = FederationConfig> {
  decorate(typeDefs: string, options: T): string;
}

@Injectable()
export class TypeDefsDecoratorFactory {
  private readonly logger = new Logger(TypeDefsDecoratorFactory.name);

  create(
    federationVersion: FederationVersion,
    apolloSubgraphVersion: number,
  ): TypeDefsDecorator | undefined {
    switch (federationVersion) {
      case 2: {
        if (apolloSubgraphVersion === 1) {
          this.logger.error(
            'To use Apollo Federation v2, you have to install the @apollo/subgraph@^2.0.0.',
          );
          return;
        }
        return new TypeDefsFederation2Decorator();
      }
      default:
        return;
    }
  }
}
