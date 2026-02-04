import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib/interfaces/mercurius-driver-config.interface';

export const HOOKS_INVOCATIONS = {
  preParsing: [0, 0],
  preValidation: [0, 0],
  preExecution: [0, 0],
  onResolution: [0, 0],
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
        preParsing: [
          (schema, document, context) => {
            this.logger.warn('preParsing1');
            HOOKS_INVOCATIONS.preParsing[0]++;
          },
          (schema, document, context) => {
            this.logger.warn('preParsing2');
            HOOKS_INVOCATIONS.preParsing[1]++;
          },
        ],
        preValidation: [
          (schema, document, context) => {
            this.logger.warn('preValidation1');
            HOOKS_INVOCATIONS.preValidation[0]++;
          },
          (schema, document, context) => {
            this.logger.warn('preValidation2');
            HOOKS_INVOCATIONS.preValidation[1]++;
          },
        ],
        preExecution: [
          (schema, document, context) => {
            this.logger.warn('preExecution1');
            HOOKS_INVOCATIONS.preExecution[0]++;
          },
          (schema, document, context) => {
            this.logger.warn('preExecution2');
            HOOKS_INVOCATIONS.preExecution[1]++;
          },
        ],
        onResolution: [
          (execution, context) => {
            this.logger.warn('onResolution1');
            HOOKS_INVOCATIONS.onResolution[0]++;
          },
          (execution, context) => {
            this.logger.warn('onResolution2');
            HOOKS_INVOCATIONS.onResolution[1]++;
          },
        ],
      },
    };
  }
}
