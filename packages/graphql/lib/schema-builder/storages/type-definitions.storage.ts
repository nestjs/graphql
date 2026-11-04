import { Injectable } from '@nestjs/common';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLUnionType,
} from 'graphql';
import { EnumDefinition } from '../factories/enum-definition.factory.js';
import { InputTypeDefinition } from '../factories/input-type-definition.factory.js';
import { InterfaceTypeDefinition } from '../factories/interface-definition.factory.js';
import { ObjectTypeDefinition } from '../factories/object-type-definition.factory.js';
import { UnionDefinition } from '../factories/union-definition.factory.js';

export type GqlInputTypeKey = Function | object;
export type GqlInputType = InputTypeDefinition | EnumDefinition;

export type GqlOutputTypeKey = Function | object | symbol | string;
export type GqlOutputType =
  | InterfaceTypeDefinition
  | ObjectTypeDefinition
  | EnumDefinition
  | UnionDefinition;

export class AmbiguousOutputTypeNameError extends Error {
  constructor(typeName: string) {
    super(
      `Cannot resolve the output type "${typeName}" by name because multiple types are registered with this name. Reference the class directly or scope the types to their modules with the "registerIn" option.`,
    );
  }
}

@Injectable()
export class TypeDefinitionsStorage {
  private readonly interfaceTypeDefinitions = new Map<
    Function,
    InterfaceTypeDefinition
  >();
  private readonly enumTypeDefinitions = new Map<object, EnumDefinition>();
  private readonly unionTypeDefinitions = new Map<symbol, UnionDefinition>();
  private readonly objectTypeDefinitions = new Map<
    Function,
    ObjectTypeDefinition
  >();
  private readonly inputTypeDefinitions = new Map<
    Function,
    InputTypeDefinition
  >();
  private readonly outputTypesByName = new Map<string, GqlOutputType>();
  private readonly ambiguousOutputTypeNames = new Set<string>();
  private readonly rootTypesByName = new Map<string, GraphQLObjectType>();
  private inputTypeDefinitionsLinks?: Map<GqlInputTypeKey, GqlInputType>;
  private outputTypeDefinitionsLinks?: Map<GqlOutputTypeKey, GqlOutputType>;

  addEnums(enumDefs: EnumDefinition[]) {
    enumDefs.forEach((item) =>
      this.enumTypeDefinitions.set(item.enumRef, item),
    );
  }

  getEnumByObject(obj: object): EnumDefinition {
    return this.enumTypeDefinitions.get(obj);
  }

  getAllEnumTypeDefinitions(): EnumDefinition[] {
    return Array.from(this.enumTypeDefinitions.values());
  }

  addUnions(unionDefs: UnionDefinition[]) {
    unionDefs.forEach((item) => this.unionTypeDefinitions.set(item.id, item));
  }

  getUnionBySymbol(key: symbol): UnionDefinition {
    return this.unionTypeDefinitions.get(key);
  }

  getAllUnionDefinitions(): UnionDefinition[] {
    return Array.from(this.unionTypeDefinitions.values());
  }

  addInterfaces(interfaceDefs: InterfaceTypeDefinition[]) {
    interfaceDefs.forEach((item) =>
      this.interfaceTypeDefinitions.set(item.target, item),
    );
  }

  getInterfaceByTarget(type: Function): InterfaceTypeDefinition {
    return this.interfaceTypeDefinitions.get(type);
  }

  getAllInterfaceDefinitions(): InterfaceTypeDefinition[] {
    return Array.from(this.interfaceTypeDefinitions.values());
  }

  addInputTypes(inputDefs: InputTypeDefinition[]) {
    inputDefs.forEach((item) =>
      this.inputTypeDefinitions.set(item.target, item),
    );
  }

  getInputTypeByTarget(type: Function): InputTypeDefinition {
    return this.inputTypeDefinitions.get(type);
  }

  getAllInputTypeDefinitions(): InputTypeDefinition[] {
    return Array.from(this.inputTypeDefinitions.values());
  }

  addObjectTypes(objectDefs: ObjectTypeDefinition[]) {
    objectDefs.forEach((item) =>
      this.objectTypeDefinitions.set(item.target, item),
    );
  }

  getObjectTypeByTarget(type: Function): ObjectTypeDefinition {
    return this.objectTypeDefinitions.get(type);
  }

  getAllObjectTypeDefinitions(): ObjectTypeDefinition[] {
    return Array.from(this.objectTypeDefinitions.values());
  }

  /**
   * Registers a generated root type (e.g. "Query") so that fields can
   * reference it by name, for example `@Field(() => 'Query')`.
   */
  addRootType(type: GraphQLObjectType) {
    this.rootTypesByName.set(type.name, type);
  }

  getInputTypeAndExtract(
    key: GqlInputTypeKey,
  ): GraphQLInputObjectType | GraphQLEnumType | undefined {
    if (!this.inputTypeDefinitionsLinks) {
      this.inputTypeDefinitionsLinks = new Map<GqlInputTypeKey, GqlInputType>([
        ...this.enumTypeDefinitions.entries(),
        ...this.inputTypeDefinitions.entries(),
      ]);
    }
    const definition = this.inputTypeDefinitionsLinks.get(key);
    if (definition) {
      return definition.type;
    }
    return;
  }

  getOutputTypeAndExtract(
    key: GqlOutputTypeKey,
  ):
    | GraphQLEnumType
    | GraphQLUnionType
    | GraphQLInterfaceType
    | GraphQLObjectType
    | undefined {
    if (!this.outputTypeDefinitionsLinks) {
      this.indexOutputTypesByName();
      this.outputTypeDefinitionsLinks = new Map<
        GqlOutputTypeKey,
        GqlOutputType
      >([
        ...this.objectTypeDefinitions.entries(),
        ...this.interfaceTypeDefinitions.entries(),
        ...this.enumTypeDefinitions.entries(),
        ...this.unionTypeDefinitions.entries(),
        ...this.outputTypesByName.entries(),
      ]);
    }
    if (this.ambiguousOutputTypeNames.has(key as string)) {
      throw new AmbiguousOutputTypeNameError(key as string);
    }
    const definition = this.outputTypeDefinitionsLinks.get(key);
    if (definition) {
      return definition.type;
    }
    return this.rootTypesByName.get(key as string);
  }

  /**
   * Indexes the registered output types by their GraphQL name so that fields
   * can reference them by name, for example `@Field(() => 'User')`.
   * Abstract types are not part of the schema and are therefore not indexed.
   * A name shared by multiple types is recorded as ambiguous so that a lookup
   * fails instead of silently resolving to the last registered type.
   */
  private indexOutputTypesByName() {
    const outputTypeDefs: GqlOutputType[] = [
      ...this.objectTypeDefinitions.values(),
      ...this.interfaceTypeDefinitions.values(),
      ...this.enumTypeDefinitions.values(),
      ...this.unionTypeDefinitions.values(),
    ];
    outputTypeDefs.forEach((item) => {
      if ('isAbstract' in item && item.isAbstract) {
        return;
      }
      const typeName = item.type.name;
      if (this.outputTypesByName.has(typeName)) {
        this.ambiguousOutputTypeNames.add(typeName);
      }
      this.outputTypesByName.set(typeName, item);
    });
  }

  /**
   * Clear all type definitions.
   * Used when generating multiple schemas with different module configurations.
   */
  clear() {
    this.interfaceTypeDefinitions.clear();
    this.enumTypeDefinitions.clear();
    this.unionTypeDefinitions.clear();
    this.objectTypeDefinitions.clear();
    this.inputTypeDefinitions.clear();
    this.outputTypesByName.clear();
    this.ambiguousOutputTypeNames.clear();
    this.rootTypesByName.clear();
    this.inputTypeDefinitionsLinks = undefined;
    this.outputTypeDefinitionsLinks = undefined;
  }
}
