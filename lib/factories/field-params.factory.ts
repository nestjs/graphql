import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
import { GqlParamtype } from '../enums/gql-paramtype.enum';

export class FieldParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: number, data: ParamData, args: any) {
    if (!args) {
      return null;
    }
    switch (type as GqlParamtype) {
      case GqlParamtype.ROOT:
        return args[0];
      case GqlParamtype.ARGS:
        return {};
      case GqlParamtype.CONTEXT:
        return data && args[1] ? args[1][data as string] : args[1];
      case GqlParamtype.INFO:
        return data && args[2] ? args[2][data as string] : args[2];
      default:
        return null;
    }
  }
}
