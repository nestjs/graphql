import { GraphQLInputObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { ClassMetadata } from '../metadata';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { InputTypeFactory } from './input-type.factory';
export interface InputTypeDefinition {
  target: Function;
  type: GraphQLInputObjectType;
  isAbstract: boolean;
}
export declare class InputTypeDefinitionFactory {
  private readonly typeDefinitionsStorage;
  private readonly inputTypeFactory;
  private readonly typeFieldsAccessor;
  private readonly astDefinitionNodeFactory;
  constructor(
    typeDefinitionsStorage: TypeDefinitionsStorage,
    inputTypeFactory: InputTypeFactory,
    typeFieldsAccessor: TypeFieldsAccessor,
    astDefinitionNodeFactory: AstDefinitionNodeFactory,
  );
  create(
    metadata: ClassMetadata,
    options: BuildSchemaOptions,
  ): InputTypeDefinition;
  private generateFields;
}
