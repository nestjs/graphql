import { Injectable } from '@nestjs/common';
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
import { get, map, sortBy, upperFirst } from 'lodash';
import {
  ClassDeclaration,
  ClassDeclarationStructure,
  InterfaceDeclaration,
  InterfaceDeclarationStructure,
  ParameterDeclarationStructure,
  SourceFile,
  StructureKind,
} from 'ts-morph';
import { DEFINITIONS_FILE_HEADER } from './graphql.constants';

@Injectable()
export class GraphQLAstExplorer {
  private readonly root = ['Query', 'Mutation', 'Subscription'];

  async explore(
    documentNode: DocumentNode,
    outputPath: string,
    mode: 'class' | 'interface',
  ): Promise<SourceFile> {
    if (!documentNode) {
      return;
    }
    const tsMorphLib = await import('ts-morph');
    const tsAstHelper = new tsMorphLib.Project();
    const tsFile = tsAstHelper.createSourceFile(outputPath, '', {
      overwrite: true,
    });

    let { definitions } = documentNode;
    definitions = sortBy(definitions, 'kind');

    definitions.forEach(item =>
      this.lookupDefinition(
        item as Readonly<TypeSystemDefinitionNode>,
        tsFile,
        mode,
      ),
    );

    tsFile.insertText(0, DEFINITIONS_FILE_HEADER);
    return tsFile;
  }

  lookupDefinition(
    item: Readonly<TypeSystemDefinitionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
  ) {
    switch (item.kind) {
      case 'SchemaDefinition':
        return this.lookupRootSchemaDefinition(
          item.operationTypes,
          tsFile,
          mode,
        );
      case 'ObjectTypeDefinition':
      case 'InputObjectTypeDefinition':
        return this.addObjectTypeDefinition(item, tsFile, mode);
      case 'InterfaceTypeDefinition':
        return this.addObjectTypeDefinition(item, tsFile, 'interface');
      case 'ScalarTypeDefinition':
        return this.addScalarDefinition(item, tsFile);
      case 'EnumTypeDefinition':
        return this.addEnumDefinition(item, tsFile);
      case 'UnionTypeDefinition':
        return this.addUnionDefinition(item, tsFile);
    }
  }

  lookupRootSchemaDefinition(
    operationTypes: ReadonlyArray<OperationTypeDefinitionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
  ) {
    const structureKind =
      mode === 'class' ? StructureKind.Class : StructureKind.Interface;
    const rootInterface = this.addClassOrInterface(tsFile, mode, {
      name: 'ISchema',
      isExported: true,
      kind: structureKind,
    });
    operationTypes.forEach(item => {
      if (!item) {
        return;
      }
      const tempOperationName = item.operation;
      const typeName = get(item, 'type.name.value');
      const interfaceName = typeName || tempOperationName;
      const interfaceRef = this.addClassOrInterface(tsFile, mode, {
        name: this.addSymbolIfRoot(upperFirst(interfaceName)),
        isExported: true,
        kind: structureKind,
      });
      (rootInterface as InterfaceDeclaration).addProperty({
        name: interfaceName,
        type: interfaceRef.getName(),
      });
    });
  }

  addObjectTypeDefinition(
    item:
      | ObjectTypeDefinitionNode
      | InputObjectTypeDefinitionNode
      | InterfaceTypeDefinitionNode,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
  ) {
    const parentName = get(item, 'name.value');
    if (!parentName) {
      return;
    }
    let parentRef = this.getClassOrInterface(
      tsFile,
      mode,
      this.addSymbolIfRoot(parentName),
    );
    if (!parentRef) {
      const structureKind =
        mode === 'class' ? StructureKind.Class : StructureKind.Interface;
      const isRoot = this.root.indexOf(parentName) >= 0;
      parentRef = this.addClassOrInterface(tsFile, mode, {
        name: this.addSymbolIfRoot(upperFirst(parentName)),
        isExported: true,
        isAbstract: isRoot && mode === 'class',
        kind: structureKind,
      });
    }
    const interfaces = get(item, 'interfaces');
    if (interfaces) {
      if (mode === 'class') {
        this.addImplementsInterfaces(interfaces, parentRef as ClassDeclaration);
      } else {
        this.addExtendInterfaces(interfaces, parentRef as InterfaceDeclaration);
      }
    }
    ((item.fields || []) as any).forEach(element => {
      this.lookupFieldDefiniton(element, parentRef, mode);
    });
  }

  lookupFieldDefiniton(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
  ) {
    switch (item.kind) {
      case 'FieldDefinition':
      case 'InputValueDefinition':
        return this.lookupField(item, parentRef, mode);
    }
  }

  lookupField(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
  ) {
    const propertyName = get(item, 'name.value');
    if (!propertyName) {
      return;
    }

    const { name: type, required } = this.getFieldTypeDefinition(item.type);
    if (!this.isRoot(parentRef.getName())) {
      (parentRef as InterfaceDeclaration).addProperty({
        name: propertyName,
        type,
        hasQuestionToken: !required,
      });
      return;
    }
    (parentRef as ClassDeclaration).addMethod({
      isAbstract: mode === 'class',
      name: propertyName,
      returnType: `${type} | Promise<${type}>`,
      parameters: this.getFunctionParameters(
        (item as FieldDefinitionNode).arguments,
      ),
    });
  }

  getFieldTypeDefinition(
    type: TypeNode,
  ): {
    name: string;
    required: boolean;
  } {
    const { required, type: nestedType } = this.getNestedType(type);
    type = nestedType;

    const isArray = type.kind === 'ListType';
    if (isArray) {
      const { type: nestedType } = this.getNestedType(get(type, 'type'));
      type = nestedType;

      const typeName = get(type, 'name.value');
      return {
        name: this.getType(typeName) + '[]',
        required,
      };
    }
    const typeName = get(type, 'name.value');
    return {
      name: this.getType(typeName),
      required,
    };
  }

  getNestedType(
    type: TypeNode,
  ): {
    type: TypeNode;
    required: boolean;
  } {
    const isNonNullType = type.kind === 'NonNullType';
    if (isNonNullType) {
      return {
        type: this.getNestedType(get(type, 'type')).type,
        required: isNonNullType,
      };
    }
    return { type, required: false };
  }

  getType(typeName: string): string {
    const defaults = this.getDefaultTypes();
    const isDefault = defaults[typeName];
    return isDefault ? defaults[typeName] : typeName;
  }

  getDefaultTypes(): { [type: string]: string } {
    return {
      String: 'string',
      Int: 'number',
      Boolean: 'boolean',
      ID: 'string',
      Float: 'number',
    };
  }

  getFunctionParameters(
    inputs: ReadonlyArray<InputValueDefinitionNode>,
  ): ParameterDeclarationStructure[] {
    if (!inputs) {
      return [];
    }
    return inputs.map(element => {
      const { name, required } = this.getFieldTypeDefinition(element.type);
      return {
        name: get(element, 'name.value'),
        type: name,
        hasQuestionToken: !required,
        kind: StructureKind.Parameter,
      };
    });
  }

  addScalarDefinition(item: ScalarTypeDefinitionNode, tsFile: SourceFile) {
    const name = get(item, 'name.value');
    if (!name || name === 'Date') {
      return;
    }
    tsFile.addTypeAlias({
      name,
      type: 'any',
      isExported: true,
    });
  }

  addExtendInterfaces(
    interfaces: NamedTypeNode[],
    parentRef: InterfaceDeclaration,
  ) {
    if (!interfaces) {
      return;
    }
    interfaces.forEach(element => {
      const interfaceName = get(element, 'name.value');
      if (interfaceName) {
        parentRef.addExtends(interfaceName);
      }
    });
  }

  addImplementsInterfaces(
    interfaces: NamedTypeNode[],
    parentRef: ClassDeclaration,
  ) {
    if (!interfaces) {
      return;
    }
    interfaces.forEach(element => {
      const interfaceName = get(element, 'name.value');
      if (interfaceName) {
        parentRef.addImplements(interfaceName);
      }
    });
  }

  addEnumDefinition(item: EnumTypeDefinitionNode, tsFile: SourceFile) {
    const name = get(item, 'name.value');
    if (!name) {
      return;
    }
    const members = map(item.values, value => ({
      name: get(value, 'name.value'),
      value: get(value, 'name.value'),
    }));
    tsFile.addEnum({
      name,
      members,
      isExported: true,
    });
  }

  addUnionDefinition(item: UnionTypeDefinitionNode, tsFile: SourceFile) {
    const name = get(item, 'name.value');
    if (!name) {
      return;
    }
    const types: string[] = map(item.types, value => get(value, 'name.value'));
    tsFile.addTypeAlias({
      name,
      type: types.join(' | '),
      isExported: true,
    });
  }

  addSymbolIfRoot(name: string): string {
    return this.root.indexOf(name) >= 0 ? `I${name}` : name;
  }

  isRoot(name: string): boolean {
    return ['IQuery', 'IMutation', 'ISubscription'].indexOf(name) >= 0;
  }

  addClassOrInterface(
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: InterfaceDeclarationStructure | ClassDeclarationStructure,
  ): InterfaceDeclaration | ClassDeclaration {
    return mode === 'class'
      ? tsFile.addClass(options as ClassDeclarationStructure)
      : tsFile.addInterface(options as InterfaceDeclarationStructure);
  }

  getClassOrInterface(
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    name: string,
  ): InterfaceDeclaration | ClassDeclaration {
    return mode === 'class' ? tsFile.getClass(name) : tsFile.getInterface(name);
  }
}
