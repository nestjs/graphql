import { Complexity, GqlTypeReference } from '../../interfaces/index.js';
import { FieldMiddleware } from '../../interfaces/field-middleware.interface.js';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { DirectiveMetadata } from './directive.metadata.js';
import { MethodArgsMetadata } from './param.metadata.js';

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
  complexity?: Complexity;
  middleware?: FieldMiddleware[];
}
