import { ParamData } from '@nestjs/common';
import { ParamsFactory } from '@nestjs/core/helpers/external-context-creator';
export declare class GqlParamsFactory implements ParamsFactory {
  exchangeKeyForValue(type: number, data: ParamData, args: any): any;
}
