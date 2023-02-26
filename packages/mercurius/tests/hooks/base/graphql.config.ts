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
        preParsing: (schema, document, context) => {
          this.logger.warn('preParsing');
          return { schema, document, context };
        },
        preValidation: (schema, document, context) => {
          this.logger.warn('preValidation');
          return { schema, document, context };
        },
        preExecution: (schema, document, context) => {
          this.logger.warn('preExecution');
          return { schema, document, context };
        },
        onResolution: (execution, context) => {
          this.logger.warn('onResolution');
          return execution;
        },
      },
    };
  }
}
