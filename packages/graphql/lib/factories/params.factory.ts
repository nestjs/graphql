import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { normalizeResolverArgs } from '../utils/normalize-resolver-args';

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
        return data && args[1] ? args[1][data as string] : args[1];
      case GqlParamtype.CONTEXT:
        return data && args[2] ? args[2][data as string] : args[2];
      case GqlParamtype.INFO:
        return data && args[3] ? args[3][data as string] : args[3];
      default:
        return null;
    }
  }
}
