import { Injectable } from '@nestjs/common';
import { BuildSchemaOptions } from '../interfaces';
import { ClassMetadata, EnumMetadata, UnionMetadata } from './metadata';
import { InterfaceMetadata } from './metadata/interface.metadata';
import { ObjectTypeMetadata } from './metadata/object-type.metadata';
import { EnumDefinitionFactory } from './factories/enum-definition.factory';
import { InputTypeDefinitionFactory } from './factories/input-type-definition.factory';
import { InterfaceDefinitionFactory } from './factories/interface-definition.factory';
import { ObjectTypeDefinitionFactory } from './factories/object-type-definition.factory';
import { UnionDefinitionFactory } from './factories/union-definition.factory';
import { TypeDefinitionsStorage } from './storages/type-definitions.storage';
import { TypeMetadataStorage } from './storages/type-metadata.storage';

@Injectable()
export class TypeDefinitionsGenerator {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly enumDefinitionFactory: EnumDefinitionFactory,
    private readonly inputTypeDefinitionFactory: InputTypeDefinitionFactory,
    private readonly objectTypeDefinitionFactory: ObjectTypeDefinitionFactory,
    private readonly interfaceDefinitionFactory: InterfaceDefinitionFactory,
    private readonly unionDefinitionFactory: UnionDefinitionFactory,
  ) {}

  generate(options: BuildSchemaOptions, includeModules?: Function[]) {
    // Clear previous type definitions to support multiple schema generation
    this.typeDefinitionsStorage.clear();

    if (includeModules?.length) {
      // Filter metadata by modules
      this.generateUnionDefs(
        TypeMetadataStorage.getUnionsMetadataByModules(includeModules),
      );
      this.generateEnumDefs(
        TypeMetadataStorage.getEnumsMetadataByModules(includeModules),
      );
      this.generateInterfaceDefs(
        options,
        TypeMetadataStorage.getInterfacesMetadataByModules(includeModules),
      );
      this.generateObjectTypeDefs(
        options,
        TypeMetadataStorage.getObjectTypesMetadataByModules(includeModules),
      );
      this.generateInputTypeDefs(
        options,
        TypeMetadataStorage.getInputTypesMetadataByModules(includeModules),
      );
    } else {
      // Use all metadata when no module filter is specified
      this.generateUnionDefs();
      this.generateEnumDefs();
      this.generateInterfaceDefs(options);
      this.generateObjectTypeDefs(options);
      this.generateInputTypeDefs(options);
    }
  }

  private generateInputTypeDefs(
    options: BuildSchemaOptions,
    metadata?: ClassMetadata[],
  ) {
    const inputTypeMetadata =
      metadata ?? TypeMetadataStorage.getInputTypesMetadata();
    const inputTypeDefs = inputTypeMetadata.map((item) =>
      this.inputTypeDefinitionFactory.create(item, options),
    );
    this.typeDefinitionsStorage.addInputTypes(inputTypeDefs);
  }

  private generateObjectTypeDefs(
    options: BuildSchemaOptions,
    metadata?: ObjectTypeMetadata[],
  ) {
    const objectTypeMetadata =
      metadata ?? TypeMetadataStorage.getObjectTypesMetadata();
    const objectTypeDefs = objectTypeMetadata.map((item) =>
      this.objectTypeDefinitionFactory.create(item, options),
    );
    this.typeDefinitionsStorage.addObjectTypes(objectTypeDefs);
  }

  private generateInterfaceDefs(
    options: BuildSchemaOptions,
    metadata?: InterfaceMetadata[],
  ) {
    const interfaceMetadata =
      metadata ?? TypeMetadataStorage.getInterfacesMetadata();
    const interfaceDefs = interfaceMetadata.map((item) =>
      this.interfaceDefinitionFactory.create(item, options),
    );
    this.typeDefinitionsStorage.addInterfaces(interfaceDefs);
  }

  private generateEnumDefs(metadata?: EnumMetadata[]) {
    const enumMetadata = metadata ?? TypeMetadataStorage.getEnumsMetadata();
    const enumDefs = enumMetadata.map((item) =>
      this.enumDefinitionFactory.create(item),
    );
    this.typeDefinitionsStorage.addEnums(enumDefs);
  }

  private generateUnionDefs(metadata?: UnionMetadata[]) {
    const unionMetadata = metadata ?? TypeMetadataStorage.getUnionsMetadata();
    const unionDefs = unionMetadata.map((item) =>
      this.unionDefinitionFactory.create(item),
    );
    this.typeDefinitionsStorage.addUnions(unionDefs);
  }
}
