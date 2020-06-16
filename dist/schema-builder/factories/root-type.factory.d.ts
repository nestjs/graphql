import { GraphQLFieldConfigMap, GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ResolverTypeMetadata } from '../metadata/resolver.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { OutputTypeFactory } from './output-type.factory';
export declare type FieldsFactory<T = any, U = any> = (
  handlers: ResolverTypeMetadata[],
  options: BuildSchemaOptions,
) => GraphQLFieldConfigMap<T, U>;
export declare class RootTypeFactory {
  private readonly outputTypeFactory;
  private readonly argsFactory;
  private readonly astDefinitionNodeFactory;
  private readonly orphanedReferenceRegistry;
  constructor(
    outputTypeFactory: OutputTypeFactory,
    argsFactory: ArgsFactory,
    astDefinitionNodeFactory: AstDefinitionNodeFactory,
    orphanedReferenceRegistry: OrphanedReferenceRegistry,
  );
  create(
    typeRefs: Function[],
    resolversMetadata: ResolverTypeMetadata[],
    objectTypeName: 'Subscription' | 'Mutation' | 'Query',
    options: BuildSchemaOptions,
    fieldsFactory?: FieldsFactory,
  ): GraphQLObjectType;
  generateFields<T = any, U = any>(
    handlers: ResolverTypeMetadata[],
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigMap<T, U>;
}
