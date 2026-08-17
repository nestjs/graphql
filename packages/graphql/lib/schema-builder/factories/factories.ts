import { ArgsFactory } from './args.factory.js';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory.js';
import { EnumDefinitionFactory } from './enum-definition.factory.js';
import { InputTypeDefinitionFactory } from './input-type-definition.factory.js';
import { InputTypeFactory } from './input-type.factory.js';
import { InterfaceDefinitionFactory } from './interface-definition.factory.js';
import { MutationTypeFactory } from './mutation-type.factory.js';
import { ObjectTypeDefinitionFactory } from './object-type-definition.factory.js';
import { OrphanedTypesFactory } from './orphaned-types.factory.js';
import { OutputTypeFactory } from './output-type.factory.js';
import { QueryTypeFactory } from './query-type.factory.js';
import { ResolveTypeFactory } from './resolve-type.factory.js';
import { RootTypeFactory } from './root-type.factory.js';
import { SubscriptionTypeFactory } from './subscription-type.factory.js';
import { UnionDefinitionFactory } from './union-definition.factory.js';

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
