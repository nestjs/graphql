import { GraphQLInterfaceType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { OutputTypeFactory } from './output-type.factory';
import { ResolveTypeFactory } from './resolve-type.factory';
export interface InterfaceTypeDefinition {
  target: Function;
  type: GraphQLInterfaceType;
  isAbstract: boolean;
}
export declare class InterfaceDefinitionFactory {
  private readonly resolveTypeFactory;
  private readonly typeDefinitionsStorage;
  private readonly outputTypeFactory;
  private readonly typeFieldsAccessor;
  constructor(
    resolveTypeFactory: ResolveTypeFactory,
    typeDefinitionsStorage: TypeDefinitionsStorage,
    outputTypeFactory: OutputTypeFactory,
    typeFieldsAccessor: TypeFieldsAccessor,
  );
  create(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): InterfaceTypeDefinition;
  private createResolveTypeFn;
  private generateFields;
}
