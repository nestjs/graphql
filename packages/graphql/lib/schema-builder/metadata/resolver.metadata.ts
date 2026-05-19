import { Type } from '@nestjs/common';
import { Complexity, GqlTypeReference } from '../../interfaces/index.js';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { DirectiveMetadata } from './directive.metadata.js';
import { MethodArgsMetadata } from './param.metadata.js';

export interface ResolverClassMetadata {
  target: Function;
  typeFn: (of?: void) => Type<unknown> | Function;
  isAbstract?: boolean;
  parent?: ResolverClassMetadata;
}

export interface BaseResolverMetadata {
  target: Function;
  methodName: string;
  schemaName: string;
  description?: string;
  deprecationReason?: string;
  methodArgs?: MethodArgsMetadata[];
  classMetadata?: ResolverClassMetadata;
  directives?: DirectiveMetadata[];
  extensions?: Record<string, unknown>;
  complexity?: Complexity;
}

export interface ResolverTypeMetadata extends BaseResolverMetadata {
  typeFn: (type?: void) => GqlTypeReference;
  returnTypeOptions: TypeOptions;
}

export interface FieldResolverMetadata extends BaseResolverMetadata {
  kind: 'internal' | 'external';
  typeOptions?: TypeOptions;
  typeFn?: (type?: void) => GqlTypeReference;
  objectTypeFn?: (of?: void) => Type<unknown> | Function;
}
