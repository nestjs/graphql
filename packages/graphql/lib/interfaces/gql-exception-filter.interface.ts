import { ArgumentsHost } from '@nestjs/common';

/**
 * @publicApi
 *
 * Interface defining a GraphQL exception filter.
 */
export interface GqlExceptionFilter<TInput = any, TOutput = any> {
  catch(exception: TInput, host: ArgumentsHost): TOutput;
}
