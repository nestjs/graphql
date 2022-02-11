import { Injectable } from '@nestjs/common';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLUnionType,
} from 'graphql';
import { EnumDefinition } from '../factories/enum-definition.factory';
import { InputTypeDefinition } from '../factories/input-type-definition.factory';
import { InterfaceTypeDefinition } from '../factories/interface-definition.factory';
import { ObjectTypeDefinition } from '../factories/object-type-definition.factory';
import { UnionDefinition } from '../factories/union-definition.factory';

export type GqlInputTypeKey = Function | object;
export type GqlInputType = InputTypeDefinition | EnumDefinition;

export type GqlOutputTypeKey = Function | object | symbol;
export type GqlOutputType =
  | InterfaceTypeDefinition
  | ObjectTypeDefinition
  | EnumDefinition
  | UnionDefinition;

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
      this.outputTypeDefinitionsLinks = new Map<
        GqlOutputTypeKey,
        GqlOutputType
      >([
        ...this.objectTypeDefinitions.entries(),
        ...this.interfaceTypeDefinitions.entries(),
        ...this.enumTypeDefinitions.entries(),
        ...this.unionTypeDefinitions.entries(),
      ]);
    }
    const definition = this.outputTypeDefinitionsLinks.get(key);
    if (definition) {
      return definition.type;
    }
    return;
  }
}
