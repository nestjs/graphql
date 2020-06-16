import { BuildSchemaOptions } from '../interfaces';
import { EnumDefinitionFactory } from './factories/enum-definition.factory';
import { InputTypeDefinitionFactory } from './factories/input-type-definition.factory';
import { InterfaceDefinitionFactory } from './factories/interface-definition.factory';
import { ObjectTypeDefinitionFactory } from './factories/object-type-definition.factory';
import { UnionDefinitionFactory } from './factories/union-definition.factory';
import { TypeDefinitionsStorage } from './storages/type-definitions.storage';
export declare class TypeDefinitionsGenerator {
  private readonly typeDefinitionsStorage;
  private readonly enumDefinitionFactory;
  private readonly inputTypeDefinitionFactory;
  private readonly objectTypeDefinitionFactory;
  private readonly interfaceDefinitionFactory;
  private readonly unionDefinitionFactory;
  constructor(
    typeDefinitionsStorage: TypeDefinitionsStorage,
    enumDefinitionFactory: EnumDefinitionFactory,
    inputTypeDefinitionFactory: InputTypeDefinitionFactory,
    objectTypeDefinitionFactory: ObjectTypeDefinitionFactory,
    interfaceDefinitionFactory: InterfaceDefinitionFactory,
    unionDefinitionFactory: UnionDefinitionFactory,
  );
  generate(options: BuildSchemaOptions): void;
  private generateInputTypeDefs;
  private generateObjectTypeDefs;
  private generateInterfaceDefs;
  private generateEnumDefs;
  private generateUnionDefs;
}
