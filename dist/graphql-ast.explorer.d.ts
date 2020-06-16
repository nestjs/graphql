import {
  DocumentNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  OperationTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  TypeNode,
  TypeSystemDefinitionNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import {
  ClassDeclaration,
  ClassDeclarationStructure,
  InterfaceDeclaration,
  InterfaceDeclarationStructure,
  ParameterDeclarationStructure,
  SourceFile,
} from 'ts-morph';
export interface DefinitionsGeneratorOptions {
  emitTypenameField?: boolean;
  skipResolverArgs?: boolean;
}
export declare class GraphQLAstExplorer {
  private readonly root;
  explore(
    documentNode: DocumentNode,
    outputPath: string,
    mode: 'class' | 'interface',
    options?: DefinitionsGeneratorOptions,
  ): Promise<SourceFile>;
  lookupDefinition(
    item: Readonly<TypeSystemDefinitionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): void;
  lookupRootSchemaDefinition(
    operationTypes: ReadonlyArray<OperationTypeDefinitionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
  ): void;
  addObjectTypeDefinition(
    item:
      | ObjectTypeDefinitionNode
      | InputObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): void;
  lookupFieldDefiniton(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): void;
  lookupField(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): void;
  getFieldTypeDefinition(
    type: TypeNode,
  ): {
    name: string;
    required: boolean;
  };
  getNestedType(
    type: TypeNode,
  ): {
    type: TypeNode;
    required: boolean;
  };
  getType(typeName: string): string;
  getDefaultTypes(): {
    [type: string]: string;
  };
  getFunctionParameters(
    inputs: ReadonlyArray<InputValueDefinitionNode>,
  ): ParameterDeclarationStructure[];
  addScalarDefinition(item: ScalarTypeDefinitionNode, tsFile: SourceFile): void;
  addExtendInterfaces(
    interfaces: NamedTypeNode[],
    parentRef: InterfaceDeclaration,
  ): void;
  addImplementsInterfaces(
    interfaces: NamedTypeNode[],
    parentRef: ClassDeclaration,
  ): void;
  addEnumDefinition(item: EnumTypeDefinitionNode, tsFile: SourceFile): void;
  addUnionDefinition(item: UnionTypeDefinitionNode, tsFile: SourceFile): void;
  addSymbolIfRoot(name: string): string;
  isRoot(name: string): boolean;
  addClassOrInterface(
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: InterfaceDeclarationStructure | ClassDeclarationStructure,
  ): InterfaceDeclaration | ClassDeclaration;
  getClassOrInterface(
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    name: string,
  ): InterfaceDeclaration | ClassDeclaration;
}
