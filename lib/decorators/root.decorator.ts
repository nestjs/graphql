import { GqlParamtype } from '../enums/gql-paramtype.enum';
import { createGqlParamDecorator } from './param.utils';

/**
 * Resolver method parameter decorator. Extracts the parent/root
 * object from the underlying platform and populates the decorated
 * parameter with the value of parent/root.
 */
export const Root: () => ParameterDecorator = createGqlParamDecorator(
  GqlParamtype.ROOT,
);
