import { Injectable } from '@nestjs/common';
import {
  DocumentNode,
  EnumTypeDefinitionNode,
  EnumTypeExtensionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  OperationTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  ScalarTypeExtensionNode,
  TypeNode,
  TypeSystemDefinitionNode,
  TypeSystemExtensionNode,
  UnionTypeDefinitionNode,
  UnionTypeExtensionNode,
} from 'graphql';
import { get, map, sortBy, upperFirst } from 'lodash';
import {
  ClassDeclaration,
  ClassDeclarationStructure,
  InterfaceDeclaration,
  InterfaceDeclarationStructure,
  ParameterDeclarationStructure,
  SourceFile,
} from 'ts-morph';
import { DEFINITIONS_FILE_HEADER } from './graphql.constants';

let tsMorphLib: typeof import('ts-morph') | undefined;

export interface DefinitionsGeneratorOptions {
  /**
   * If true, the additional "__typename" field is generated for every object type.
   * @default false
   */
  emitTypenameField?: boolean;

  /**
   * If true, resolvers (query/mutation/etc) are generated as plain fields without arguments.
   * @default false
   */
  skipResolverArgs?: boolean;

  /**
   * If provided, specifies a default generated TypeScript type for custom scalars.
   * @default 'any'
   */
  defaultScalarType?: string;

  /**
   * If provided, specifies a mapping of types to use for custom scalars
   * @default undefined
   */
  customScalarTypeMapping?: Record<string, string | { name: string }>;

  /**
   * If provided, specifies a mapping of default scalar types (Int, Boolean, ID, Float, String).
   * @default undefined
   */
  defaultTypeMapping?: Partial<
    Record<'ID' | 'Boolean' | 'Float' | 'String' | 'Int', string>
  >;

  /**
   * If provided, specifies a custom header to add after the
   * to the output file (eg. for custom type imports or comments)
   * @default undefined
   */
  additionalHeader?: string;

  /**
   * If true, enums are generated as string literal union types.
   * @default false
   */
  enumsAsTypes?: boolean;
}

@Injectable()
export class GraphQLAstExplorer {
  private readonly root = ['Query', 'Mutation', 'Subscription'];

  async explore(
    documentNode: DocumentNode,
    outputPath: string,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions = {},
  ): Promise<SourceFile> {
    if (!documentNode) {
      return;
    }
    tsMorphLib = await import('ts-morph');
    const tsAstHelper = new tsMorphLib.Project({
      manipulationSettings: {
        newLineKind:
          process.platform === 'win32'
            ? tsMorphLib.NewLineKind.CarriageReturnLineFeed
            : tsMorphLib.NewLineKind.LineFeed,
      },
    });
    const tsFile = tsAstHelper.createSourceFile(outputPath, '', {
      overwrite: true,
    });

    let { definitions } = documentNode;
    definitions = sortBy(definitions, ['kind', 'name']);

    definitions.forEach((item) =>
      this.lookupDefinition(
        item as Readonly<TypeSystemDefinitionNode>,
        tsFile,
        mode,
        options,
      ),
    );

    const header = options.additionalHeader
      ? `${DEFINITIONS_FILE_HEADER}\n${options.additionalHeader}\n\n`
      : DEFINITIONS_FILE_HEADER;
    tsFile.insertText(0, header);
    tsFile.addTypeAlias({
      name: 'Nullable',
      isExported: false,
      type: 'T | null',
      typeParameters: [
        {
          name: 'T',
        },
      ],
    });

    return tsFile;
  }

  lookupDefinition(
    item: Readonly<TypeSystemDefinitionNode | TypeSystemExtensionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ) {
    switch (item.kind) {
      case 'SchemaDefinition':
        return this.lookupRootSchemaDefinition(
          item.operationTypes,
          tsFile,
          mode,
        );
      case 'ObjectTypeDefinition':
      case 'ObjectTypeExtension':
      case 'InputObjectTypeDefinition':
      case 'InputObjectTypeExtension':
        return this.addObjectTypeDefinition(item, tsFile, mode, options);
      case 'InterfaceTypeDefinition':
      case 'InterfaceTypeExtension':
        return this.addObjectTypeDefinition(item, tsFile, 'interface', options);
      case 'ScalarTypeDefinition':
      case 'ScalarTypeExtension':
        return this.addScalarDefinition(item, tsFile, options);
      case 'EnumTypeDefinition':
      case 'EnumTypeExtension':
        return this.addEnumDefinition(item, tsFile, options);
      case 'UnionTypeDefinition':
      case 'UnionTypeExtension':
        return this.addUnionDefinition(item, tsFile);
    }
  }

  lookupRootSchemaDefinition(
    operationTypes: ReadonlyArray<OperationTypeDefinitionNode>,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
  ) {
    const structureKind =
      mode === 'class'
        ? tsMorphLib.StructureKind.Class
        : tsMorphLib.StructureKind.Interface;
    const rootInterface = this.addClassOrInterface(tsFile, mode, {
      name: 'ISchema',
      isExported: true,
      kind: structureKind,
    });
    operationTypes.forEach((item) => {
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
      | ObjectTypeExtensionNode
      | InputObjectTypeDefinitionNode
      | InputObjectTypeExtensionNode
      | InterfaceTypeDefinitionNode
      | InterfaceTypeExtensionNode,
    tsFile: SourceFile,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
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
        mode === 'class'
          ? tsMorphLib.StructureKind.Class
          : tsMorphLib.StructureKind.Interface;
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

    const isObjectType = item.kind === 'ObjectTypeDefinition';
    if (isObjectType && options.emitTypenameField) {
      parentRef.addProperty({
        name: '__typename',
        type: `'${parentRef.getName()}'`,
        hasQuestionToken: true,
      });
    }
    ((item.fields || []) as any).forEach((element) => {
      this.lookupFieldDefiniton(element, parentRef, mode, options);
    });
  }

  lookupFieldDefiniton(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ) {
    switch (item.kind) {
      case 'FieldDefinition':
      case 'InputValueDefinition':
        return this.lookupField(item, parentRef, mode, options);
    }
  }

  lookupField(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    parentRef: InterfaceDeclaration | ClassDeclaration,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ) {
    const propertyName = get(item, 'name.value');
    if (!propertyName) {
      return;
    }
    const federatedFields = ['_entities', '_service'];
    if (federatedFields.includes(propertyName)) {
      return;
    }

    const { name: type, required } = this.getFieldTypeDefinition(
      item.type,
      options,
    );
    if (!this.isRoot(parentRef.getName())) {
      (parentRef as InterfaceDeclaration).addProperty({
        name: propertyName,
        type,
        hasQuestionToken: !required,
      });
      return;
    }

    if (options.skipResolverArgs) {
      (parentRef as ClassDeclaration).addProperty({
        name: propertyName,
        type: this.addSymbolIfRoot(type),
        hasQuestionToken: !required,
      });
    } else {
      (parentRef as ClassDeclaration).addMethod({
        isAbstract: mode === 'class',
        name: propertyName,
        returnType: `${type} | Promise<${type}>`,
        parameters: this.getFunctionParameters(
          (item as FieldDefinitionNode).arguments,
          options,
        ),
      });
    }
  }

  getFieldTypeDefinition(
    typeNode: TypeNode,
    options: DefinitionsGeneratorOptions,
  ): {
    name: string;
    required: boolean;
  } {
    const { required, type } = this.getNestedType(typeNode);

    const isArray = type.kind === 'ListType';
    if (isArray) {
      const {
        type: arrayType,
        required: arrayTypeRequired,
      } = this.getNestedType(get(type, 'type'));

      const typeName = this.addSymbolIfRoot(get(arrayType, 'name.value'));
      const name = arrayTypeRequired
        ? this.getType(typeName, options)
        : `Nullable<${this.getType(typeName, options)}>`;

      return {
        name: required ? name + '[]' : `Nullable<${name}[]>`,
        required,
      };
    }

    const typeName = this.addSymbolIfRoot(get(type, 'name.value'));

    return {
      name: required
        ? this.getType(typeName, options)
        : `Nullable<${this.getType(typeName, options)}>`,
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

  getType(typeName: string, options: DefinitionsGeneratorOptions): string {
    const defaults = this.getDefaultTypes(options);
    const isDefault = defaults[typeName];
    return isDefault ? defaults[typeName] : typeName;
  }

  getDefaultTypes(
    options: DefinitionsGeneratorOptions,
  ): { [type: string]: string } {
    return {
      String: options.defaultTypeMapping?.String ?? 'string',
      Int: options.defaultTypeMapping?.Int ?? 'number',
      Boolean: options.defaultTypeMapping?.Boolean ?? 'boolean',
      ID: options.defaultTypeMapping?.ID ?? 'string',
      Float: options.defaultTypeMapping?.Float ?? 'number',
    };
  }

  getFunctionParameters(
    inputs: ReadonlyArray<InputValueDefinitionNode>,
    options: DefinitionsGeneratorOptions,
  ): ParameterDeclarationStructure[] {
    if (!inputs) {
      return [];
    }
    return inputs.map((element) => {
      const { name, required } = this.getFieldTypeDefinition(
        element.type,
        options,
      );
      return {
        name: get(element, 'name.value'),
        type: name,
        hasQuestionToken: !required,
        kind: tsMorphLib.StructureKind.Parameter,
      };
    });
  }

  addScalarDefinition(
    item: ScalarTypeDefinitionNode | ScalarTypeExtensionNode,
    tsFile: SourceFile,
    options: DefinitionsGeneratorOptions,
  ) {
    const name = get(item, 'name.value');
    if (!name || name === 'Date') {
      return;
    }

    const typeMapping = options.customScalarTypeMapping?.[name];
    const mappedTypeName =
      typeof typeMapping === 'string' ? typeMapping : typeMapping?.name;

    tsFile.addTypeAlias({
      name,
      type: mappedTypeName ?? options.defaultScalarType ?? 'any',
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
    interfaces.forEach((element) => {
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
    interfaces.forEach((element) => {
      const interfaceName = get(element, 'name.value');
      if (interfaceName) {
        parentRef.addImplements(interfaceName);
      }
    });
  }

  addEnumDefinition(
    item: EnumTypeDefinitionNode | EnumTypeExtensionNode,
    tsFile: SourceFile,
    options: DefinitionsGeneratorOptions,
  ) {
    const name = get(item, 'name.value');
    if (!name) {
      return;
    }
    if (options.enumsAsTypes) {
      const values = item.values.map(
        (value) => `"${get(value, 'name.value')}"`,
      );
      return tsFile.addTypeAlias({
        name,
        type: values.join(' | '),
        isExported: true,
      });
    }
    const members = map(item.values, (value) => ({
      name: get(value, 'name.value'),
      value: get(value, 'name.value'),
    }));
    tsFile.addEnum({
      name,
      members,
      isExported: true,
    });
  }

  addUnionDefinition(
    item: UnionTypeDefinitionNode | UnionTypeExtensionNode,
    tsFile: SourceFile,
  ) {
    const name = get(item, 'name.value');
    if (!name) {
      return;
    }
    const types: string[] = map(item.types, (value) =>
      get(value, 'name.value'),
    );
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
