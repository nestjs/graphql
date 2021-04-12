import { Complexity, GqlTypeReference } from '../../interfaces';
import { FieldMiddleware } from '../../interfaces/field-middleware.interface';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { DirectiveMetadata } from './directive.metadata';
import { MethodArgsMetadata } from './param.metadata';

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
