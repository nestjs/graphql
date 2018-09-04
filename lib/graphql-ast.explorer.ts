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
import { get, isEmpty, map, upperFirst } from 'lodash';
import TypeScriptAst, {
  InterfaceDeclaration,
  ParameterDeclarationStructure,
  SourceFile,
} from 'ts-simple-ast';

@Injectable()
export class GraphQLAstExplorer {
  explore(documentNode: DocumentNode, outputPath: string): SourceFile {
    if (!documentNode) {
      return;
    }
    const { definitions } = documentNode;

    const tsAstHelper = new TypeScriptAst();
    const tsFile = tsAstHelper.createSourceFile(outputPath, '', {
      overwrite: true,
    });

    definitions.forEach(item =>
      this.lookupDefinition(item as TypeSystemDefinitionNode, tsFile),
    );
    return tsFile;
  }

  lookupDefinition(item: TypeSystemDefinitionNode, tsFile: SourceFile) {
    switch (item.kind) {
      case 'SchemaDefinition':
        return this.lookupRootSchemaDefinition(item.operationTypes, tsFile);
      case 'ObjectTypeDefinition':
      case 'InputObjectTypeDefinition':
      case 'InterfaceTypeDefinition':
        return this.addObjectTypeDefinition(item, tsFile);
      case 'ScalarTypeDefinition':
        return this.addScalarDefinition(item, tsFile);
      case 'EnumTypeDefinition':
        return this.addEnumDefinition(item, tsFile);
      case 'UnionTypeDefinition':
        return this.addUnionDefinition(item, tsFile);
    }
  }

  lookupRootSchemaDefinition(
    operationTypes: OperationTypeDefinitionNode[],
    tsFile: SourceFile,
  ) {
    const rootInterface = tsFile.addInterface({
      name: 'GqlSchema',
      isExported: true,
    });
    operationTypes.forEach(item => {
      if (!item) {
        return;
      }
      const tempOperationName = item.operation;
      const typeName = get(item, 'type.name.value');
      const interfaceName = typeName || tempOperationName;
      const interfaceRef = tsFile.addInterface({
        name: upperFirst(interfaceName),
        isExported: true,
      });
      rootInterface.addProperty({
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
  ) {
    const parentName = get(item, 'name.value');
    if (!parentName) {
      return;
    }
    let parentRef = tsFile.getInterface(parentName);
    if (!parentRef) {
      parentRef = tsFile.addInterface({
        name: upperFirst(parentName),
        isExported: true,
      });
    }
    const interfaces = get(item, 'interfaces');
    if (interfaces) {
      this.addExtendInterfaces(interfaces, parentRef);
    }
    ((item.fields || []) as any).forEach(element => {
      this.lookupFieldDefiniton(element, tsFile, parentRef);
    });
  }

  lookupFieldDefiniton(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    tsFile: SourceFile,
    parentRef: InterfaceDeclaration,
  ) {
    switch (item.kind) {
      case 'FieldDefinition':
      case 'InputValueDefinition':
        return this.lookupField(item, tsFile, parentRef);
    }
  }

  lookupField(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    tsFile: SourceFile,
    parentRef: InterfaceDeclaration,
  ) {
    const propertyName = get(item, 'name.value');
    if (!propertyName) {
      return;
    }
    const isFunction =
      (item as FieldDefinitionNode).arguments &&
      !isEmpty((item as FieldDefinitionNode).arguments);

    const { name: type, required } = this.getFieldTypeDefinition(item.type);
    if (!isFunction) {
      parentRef.addProperty({
        name: propertyName,
        type,
        hasQuestionToken: !required,
      });
      return;
    }
    parentRef.addMethod({
      name: propertyName,
      returnType: type,
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
      const { required, type: nestedType } = this.getNestedType(
        get(type, 'type'),
      );
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
    inputs: InputValueDefinitionNode[],
  ): ParameterDeclarationStructure[] {
    return inputs.map(element => {
      const { name, required } = this.getFieldTypeDefinition(element.type);
      return {
        name: get(element, 'name.value'),
        type: name,
        hasQuestionToken: !required,
      };
    });
  }

  addScalarDefinition(item: ScalarTypeDefinitionNode, tsFile: SourceFile) {
    const name = get(item, 'name.value');
    if (!name) {
      return;
    }
    tsFile.addTypeAlias({
      name,
      type: 'any',
      isExported: true,
    });
  }

  addExtendInterfaces(
    intefaces: NamedTypeNode[],
    parentRef: InterfaceDeclaration,
  ) {
    if (!intefaces) {
      return;
    }
    intefaces.forEach(element => {
      const interfaceName = get(element, 'name.value');
      if (interfaceName) {
        parentRef.addExtends(interfaceName);
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
}
