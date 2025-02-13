import { ArgumentsHost } from '@nestjs/common';

/**
 * Interface defining a GraphQL exception filter.
 *
 * @publicApi
 */
export interface GqlExceptionFilter<TInput = any, TOutput = any> {
  catch(exception: TInput, host: ArgumentsHost): TOutput;
}
