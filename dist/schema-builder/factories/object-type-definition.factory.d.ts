import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { OutputTypeFactory } from './output-type.factory';
export interface ObjectTypeDefinition {
  target: Function;
  type: GraphQLObjectType;
  isAbstract: boolean;
  interfaces: Function[];
}
export declare class ObjectTypeDefinitionFactory {
  private readonly typeDefinitionsStorage;
  private readonly outputTypeFactory;
  private readonly typeFieldsAccessor;
  private readonly astDefinitionNodeFactory;
  private readonly orphanedReferenceRegistry;
  private readonly argsFactory;
  constructor(
    typeDefinitionsStorage: TypeDefinitionsStorage,
    outputTypeFactory: OutputTypeFactory,
    typeFieldsAccessor: TypeFieldsAccessor,
    astDefinitionNodeFactory: AstDefinitionNodeFactory,
    orphanedReferenceRegistry: OrphanedReferenceRegistry,
    argsFactory: ArgsFactory,
  );
  create(
    metadata: ObjectTypeMetadata,
    options: BuildSchemaOptions,
  ): ObjectTypeDefinition;
  private generateInterfaces;
  private generateFields;
}
