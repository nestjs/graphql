import { ArgsParamMetadata } from '../metadata';

export class CannotDetermineArgTypeError extends Error {
  constructor(hostType: string, param: ArgsParamMetadata) {
    super(
      `"${hostType}" cannot be found in the registry (${param.target.name}#${param.methodName}). This is often caused by missing argument name in the method signature. A potential fix: change @Args() to @Args('argumentName').`,
    );
  }
}
