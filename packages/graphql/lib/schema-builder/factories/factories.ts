import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { EnumDefinitionFactory } from './enum-definition.factory';
import { InputTypeDefinitionFactory } from './input-type-definition.factory';
import { InputTypeFactory } from './input-type.factory';
import { InterfaceDefinitionFactory } from './interface-definition.factory';
import { MutationTypeFactory } from './mutation-type.factory';
import { ObjectTypeDefinitionFactory } from './object-type-definition.factory';
import { OrphanedTypesFactory } from './orphaned-types.factory';
import { OutputTypeFactory } from './output-type.factory';
import { QueryTypeFactory } from './query-type.factory';
import { ResolveTypeFactory } from './resolve-type.factory';
import { RootTypeFactory } from './root-type.factory';
import { SubscriptionTypeFactory } from './subscription-type.factory';
import { UnionDefinitionFactory } from './union-definition.factory';

export const schemaBuilderFactories = [
  EnumDefinitionFactory,
  InputTypeDefinitionFactory,
  ArgsFactory,
  InputTypeFactory,
  InterfaceDefinitionFactory,
  MutationTypeFactory,
  ObjectTypeDefinitionFactory,
  OutputTypeFactory,
  OrphanedTypesFactory,
  OutputTypeFactory,
  QueryTypeFactory,
  ResolveTypeFactory,
  RootTypeFactory,
  SubscriptionTypeFactory,
  UnionDefinitionFactory,
  AstDefinitionNodeFactory,
];
