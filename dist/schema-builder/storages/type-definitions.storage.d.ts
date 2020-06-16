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
export declare type GqlInputTypeKey = Function | object;
export declare type GqlInputType = InputTypeDefinition | EnumDefinition;
export declare type GqlOutputTypeKey = Function | object | symbol;
export declare type GqlOutputType =
  | InterfaceTypeDefinition
  | ObjectTypeDefinition
  | EnumDefinition
  | UnionDefinition;
export declare class TypeDefinitionsStorage {
  private readonly interfaceTypeDefinitions;
  private readonly enumTypeDefinitions;
  private readonly unionTypeDefinitions;
  private readonly objectTypeDefinitions;
  private readonly inputTypeDefinitions;
  private inputTypeDefinitionsLinks?;
  private outputTypeDefinitionsLinks?;
  addEnums(enumDefs: EnumDefinition[]): void;
  getEnumByObject(obj: object): EnumDefinition;
  addUnions(unionDefs: UnionDefinition[]): void;
  getUnionBySymbol(key: symbol): UnionDefinition;
  addInterfaces(interfaceDefs: InterfaceTypeDefinition[]): void;
  getInterfaceByTarget(type: Function): InterfaceTypeDefinition;
  getAllInterfaceDefinitions(): InterfaceTypeDefinition[];
  addInputTypes(inputDefs: InputTypeDefinition[]): void;
  getInputTypeByTarget(type: Function): InputTypeDefinition;
  getAllInputTypeDefinitions(): InputTypeDefinition[];
  addObjectTypes(objectDefs: ObjectTypeDefinition[]): void;
  getObjectTypeByTarget(type: Function): ObjectTypeDefinition;
  getAllObjectTypeDefinitions(): ObjectTypeDefinition[];
  getInputTypeAndExtract(
    key: GqlInputTypeKey,
  ): GraphQLInputObjectType | GraphQLEnumType | undefined;
  getOutputTypeAndExtract(
    key: GqlOutputTypeKey,
  ):
    | GraphQLEnumType
    | GraphQLUnionType
    | GraphQLInterfaceType
    | GraphQLObjectType
    | undefined;
}
