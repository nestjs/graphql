import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlParamDecorator } from './param.utils';

export const Parent: () => ParameterDecorator = createGqlParamDecorator(
  GqlParamtype.ROOT,
);
