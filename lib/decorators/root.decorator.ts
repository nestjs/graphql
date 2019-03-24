import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlParamDecorator } from './param.utils';

export const Root: () => ParameterDecorator = createGqlParamDecorator(
  GqlParamtype.ROOT,
);
