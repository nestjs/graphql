import { GqlParamtype } from '../enums/gql-paramtype.enum.js';
import { createGqlParamDecorator } from './param.utils.js';

/**
 * Resolver method parameter decorator. Extracts the parent/root
 * object from the underlying platform and populates the decorated
 * parameter with the value of parent/root.
 *
 * @publicApi
 */
export const Root: () => ParameterDecorator = createGqlParamDecorator(
  GqlParamtype.ROOT,
);
