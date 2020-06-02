import { Complexity, GqlTypeReference } from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { DirectiveMetadata } from './directive.metadata';
import { MethodArgsMetadata } from './param.metadata';
import { PropertyMiddlewareMetadata } from './middleware.metadata';

export interface PropertyMetadata {
  schemaName: string;
  name: string;
  typeFn: () => GqlTypeReference;
  target: Function;
  options: TypeOptions;
  description?: string;
  deprecationReason?: string;
  methodArgs?: MethodArgsMetadata[];
  directives?: DirectiveMetadata[];
  extensions?: Record<string, unknown>;
  middleware?: PropertyMiddlewareMetadata[];
  complexity?: Complexity;
}
