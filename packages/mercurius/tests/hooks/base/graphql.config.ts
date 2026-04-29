import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib/interfaces/mercurius-driver-config.interface';

export const HOOKS_INVOCATIONS = {
  preParsing: 0,
  preValidation: 0,
  preExecution: 0,
  onResolution: 0,
};

@Injectable()
export class GqlConfigService
  implements GqlOptionsFactory<MercuriusDriverConfig>
{
  private readonly logger = new Logger(GqlConfigService.name);

  public createGqlOptions(): MercuriusDriverConfig {
    return {
      autoSchemaFile: true,
      hooks: {
        preParsing: (schema, document, context) => {
          HOOKS_INVOCATIONS.preParsing += 1;
          this.logger.warn('preParsing');
        },
        preValidation: (schema, document, context) => {
          HOOKS_INVOCATIONS.preValidation += 1;
          this.logger.warn('preValidation');
        },
        preExecution: (schema, document, context) => {
          HOOKS_INVOCATIONS.preExecution += 1;
          this.logger.warn('preExecution');
        },
        onResolution: (execution, context) => {
          HOOKS_INVOCATIONS.onResolution += 1;
          this.logger.warn('onResolution');
        },
      },
    };
  }
}
