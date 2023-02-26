import { Injectable, Logger } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusDriverConfig } from '../../../lib/interfaces/mercurius-driver-config.interface';

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
            return { schema, document, context };
          },
          (schema, document, context) => {
            this.logger.warn('preParsing2');
            return { schema, document, context };
          },
        ],
        preValidation: [
          (schema, document, context) => {
            this.logger.warn('preValidation1');
            return { schema, document, context };
          },
          (schema, document, context) => {
            this.logger.warn('preValidation2');
            return { schema, document, context };
          },
        ],
        preExecution: [
          (schema, document, context) => {
            this.logger.warn('preExecution1');
            return { schema, document, context };
          },
          (schema, document, context) => {
            this.logger.warn('preExecution2');
            return { schema, document, context };
          },
        ],
        onResolution: [
          (execution, context) => {
            this.logger.warn('onResolution1');
            return execution;
          },
          (execution, context) => {
            this.logger.warn('onResolution2');
            return execution;
          },
        ],
      },
    };
  }
}
