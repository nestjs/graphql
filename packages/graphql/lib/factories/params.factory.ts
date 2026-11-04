import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator.js';
import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { normalizeResolverArgs } from '../utils/normalize-resolver-args.js';

/**
 * @publicApi
 */
export class GqlParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: number, data: ParamData, args: any) {
    if (!args) {
      return null;
    }

    args = normalizeResolverArgs(args);

    switch (type as GqlParamtype) {
      case GqlParamtype.ROOT:
        return args[0];
      case GqlParamtype.ARGS:
        if (!data || !args[1]) {
          return args[1];
        }
        // An argument the client left out is missing from the arguments
        // object, so it must not resolve to a member of "Object.prototype"
        // (e.g., "constructor" or "toString")
        return !Object.prototype.hasOwnProperty.call(args[1], data as string) &&
          (data as string) in Object.prototype
          ? undefined
          : args[1][data as string];
      case GqlParamtype.CONTEXT:
        return data && args[2] ? args[2][data as string] : args[2];
      case GqlParamtype.INFO:
        return data && args[3] ? args[3][data as string] : args[3];
      default:
        return null;
    }
  }
}
