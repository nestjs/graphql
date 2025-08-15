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
import type {
  ClassDeclarationStructure,
  EnumDeclarationStructure,
  InterfaceDeclarationStructure,
  MethodDeclarationStructure,
  MethodSignatureStructure,
  OptionalKind,
  ParameterDeclarationStructure,
  PropertyDeclarationStructure,
  PropertySignatureStructure,
  SourceFile,
  TypeAliasDeclarationStructure,
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
    Record<'ID' | 'Float' | 'Int', 'string' | 'number'> &
      Record<'Boolean' | 'String', 'boolean' | 'string' | 'number'>
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

  /**
   * If provided, specifies a function to transform type names.
   * @example (name) => `${name}Schema`
   * @default undefined
   */
  typeName?: (name: string) => string;
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

    const fileStructure = tsFile.getStructure();

    const header = options.additionalHeader
      ? `${DEFINITIONS_FILE_HEADER}\n\n${options.additionalHeader}`
      : DEFINITIONS_FILE_HEADER;

    fileStructure.statements = [header];

    fileStructure.statements.push(
      ...definitions
        .map((item) =>
          this.toDefinitionStructures(
            item as Readonly<TypeSystemDefinitionNode>,
            mode,
            options,
          ),
        )
        .filter(Boolean),
    );

    fileStructure.statements.push({
      kind: tsMorphLib.StructureKind.TypeAlias,
      name: 'Nullable',
      isExported: false,
      type: 'T | null',
      typeParameters: [
        {
          name: 'T',
        },
      ],
    });

    tsFile.set(fileStructure);

    return tsFile;
  }

  toDefinitionStructures(
    item: Readonly<TypeSystemDefinitionNode | TypeSystemExtensionNode>,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ) {
    switch (item.kind) {
      case 'SchemaDefinition':
        return this.toRootSchemaDefinitionStructure(item.operationTypes, mode);
      case 'ObjectTypeDefinition':
      case 'ObjectTypeExtension':
      case 'InputObjectTypeDefinition':
      case 'InputObjectTypeExtension':
        return this.toObjectTypeDefinitionStructure(item, mode, options);
      case 'InterfaceTypeDefinition':
      case 'InterfaceTypeExtension':
        return this.toObjectTypeDefinitionStructure(item, 'interface', options);
      case 'ScalarTypeDefinition':
      case 'ScalarTypeExtension':
        return this.toScalarDefinitionStructure(item, options);
      case 'EnumTypeDefinition':
      case 'EnumTypeExtension':
        return this.toEnumDefinitionStructure(item, options);
      case 'UnionTypeDefinition':
      case 'UnionTypeExtension':
        return this.toUnionDefinitionStructure(item, options);
    }
  }

  toRootSchemaDefinitionStructure(
    operationTypes: ReadonlyArray<OperationTypeDefinitionNode>,
    mode: 'class' | 'interface',
  ): ClassDeclarationStructure | InterfaceDeclarationStructure {
    const structureKind =
      mode === 'class'
        ? tsMorphLib.StructureKind.Class
        : tsMorphLib.StructureKind.Interface;

    const properties = operationTypes
      .filter(Boolean)
      .map((item) => {
        const tempOperationName = item.operation;
        const typeName = get(item, 'type.name.value');
        const interfaceName = typeName || tempOperationName;
        return {
          name: interfaceName,
          type: this.addSymbolIfRoot(upperFirst(interfaceName)),
        };
      })
      .filter(Boolean);

    return {
      name: 'ISchema',
      isExported: true,
      kind: structureKind,
      properties: properties,
    };
  }

  toObjectTypeDefinitionStructure(
    item:
      | ObjectTypeDefinitionNode
      | ObjectTypeExtensionNode
      | InputObjectTypeDefinitionNode
      | InputObjectTypeExtensionNode
      | InterfaceTypeDefinitionNode
      | InterfaceTypeExtensionNode,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): ClassDeclarationStructure | InterfaceDeclarationStructure {
    const parentName = get(item, 'name.value');
    if (!parentName) {
      return;
    }
    const structureKind =
      mode === 'class'
        ? tsMorphLib.StructureKind.Class
        : tsMorphLib.StructureKind.Interface;
    const isRoot = this.root.indexOf(parentName) >= 0;
    // Don't transform root type names (Query, Mutation, Subscription)
    const transformedName = isRoot
      ? parentName
      : this.getTransformedTypeName(parentName, options);
    const parentStructure:
      | ClassDeclarationStructure
      | InterfaceDeclarationStructure = {
      name: this.addSymbolIfRoot(upperFirst(transformedName)),
      isExported: true,
      isAbstract: isRoot && mode === 'class',
      kind: structureKind,
      properties: [],
      methods: [],
    };

    const interfaces = get(item, 'interfaces');
    if (interfaces) {
      if (mode === 'class') {
        (parentStructure as ClassDeclarationStructure).implements = interfaces
          .map((element) => {
            const interfaceName = get(element, 'name.value');
            return interfaceName
              ? this.getTransformedTypeName(interfaceName, options)
              : null;
          })
          .filter(Boolean);
      } else {
        parentStructure.extends = interfaces
          .map((element) => {
            const interfaceName = get(element, 'name.value');
            return interfaceName
              ? this.getTransformedTypeName(interfaceName, options)
              : null;
          })
          .filter(Boolean);
      }
    }

    const isObjectType = item.kind === 'ObjectTypeDefinition';
    if (isObjectType && options.emitTypenameField) {
      parentStructure.properties.push({
        name: '__typename',
        type: `'${parentStructure.name}'`,
        hasQuestionToken: true,
      });
    }

    if (!this.isRoot(parentStructure.name) || options.skipResolverArgs) {
      const properties: readonly (OptionalKind<PropertyDeclarationStructure> &
        OptionalKind<PropertySignatureStructure>)[] = (
        (item.fields || []) as (
          | FieldDefinitionNode
          | InputValueDefinitionNode
        )[]
      )
        .map((element) => this.toPropertyDeclarationStructure(element, options))
        .filter(Boolean);

      parentStructure.properties.push(...properties);
    } else {
      const methods: readonly (OptionalKind<MethodDeclarationStructure> &
        OptionalKind<MethodSignatureStructure>)[] = (
        (item.fields || []) as (
          | FieldDefinitionNode
          | InputValueDefinitionNode
        )[]
      )
        .map((element) =>
          this.toMethodDeclarationStructure(element, mode, options),
        )
        .filter(Boolean);

      parentStructure.methods.push(...methods);
    }
    return parentStructure;
  }

  toPropertyDeclarationStructure(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    options: DefinitionsGeneratorOptions,
  ): OptionalKind<PropertyDeclarationStructure> &
    OptionalKind<PropertySignatureStructure> {
    const propertyName = get(item, 'name.value');
    if (!propertyName) {
      return undefined;
    }
    const federatedFields = ['_entities', '_service'];
    if (federatedFields.includes(propertyName)) {
      return undefined;
    }

    const { name: type, required } = this.getFieldTypeDefinition(
      item.type,
      options,
    );

    return {
      name: propertyName,
      type: this.addSymbolIfRoot(type),
      hasQuestionToken:
        !required || (item as FieldDefinitionNode).arguments?.length > 0,
    };
  }

  toMethodDeclarationStructure(
    item: FieldDefinitionNode | InputValueDefinitionNode,
    mode: 'class' | 'interface',
    options: DefinitionsGeneratorOptions,
  ): OptionalKind<MethodDeclarationStructure> &
    OptionalKind<MethodSignatureStructure> {
    const propertyName = get(item, 'name.value');
    if (!propertyName) {
      return;
    }
    const federatedFields = ['_entities', '_service'];
    if (federatedFields.includes(propertyName)) {
      return;
    }

    const { name: type } = this.getFieldTypeDefinition(item.type, options);

    return {
      isAbstract: mode === 'class',
      name: propertyName,
      returnType: `${type} | Promise<${type}>`,
      parameters: this.getFunctionParameters(
        (item as FieldDefinitionNode).arguments,
        options,
      ),
    };
  }

  getFieldTypeDefinition(
    typeNode: TypeNode,
    options: DefinitionsGeneratorOptions,
  ): {
    name: string;
    required: boolean;
  } {
    const stringifyType = (typeNode: TypeNode) => {
      const { type, required } = this.unwrapTypeIfNonNull(typeNode);
      const isArray = type.kind === 'ListType';

      if (isArray) {
        const arrayType = get(type, 'type');
        return required
          ? `${stringifyType(arrayType)}[]`
          : `Nullable<${stringifyType(arrayType)}[]>`;
      }
      const typeName = this.addSymbolIfRoot(get(type, 'name.value'));
      return required
        ? this.getType(typeName, options)
        : `Nullable<${this.getType(typeName, options)}>`;
    };

    const { required } = this.unwrapTypeIfNonNull(typeNode);
    return {
      name: stringifyType(typeNode),
      required,
    };
  }

  unwrapTypeIfNonNull(type: TypeNode): {
    type: TypeNode;
    required: boolean;
  } {
    const isNonNullType = type.kind === 'NonNullType';
    if (isNonNullType) {
      return {
        type: this.unwrapTypeIfNonNull(get(type, 'type')).type,
        required: isNonNullType,
      };
    }
    return { type, required: false };
  }

  getType(typeName: string, options: DefinitionsGeneratorOptions): string {
    const defaults = this.getDefaultTypes(options);
    const isDefault = defaults[typeName];
    if (isDefault) {
      return defaults[typeName];
    }
    const transformedName = this.getTransformedTypeName(typeName, options);
    return upperFirst(transformedName);
  }

  getDefaultTypes(options: DefinitionsGeneratorOptions): {
    [type: string]: string;
  } {
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

  toScalarDefinitionStructure(
    item: ScalarTypeDefinitionNode | ScalarTypeExtensionNode,
    options: DefinitionsGeneratorOptions,
  ): TypeAliasDeclarationStructure {
    const name = get(item, 'name.value');
    if (!name || name === 'Date') {
      return undefined;
    }

    const typeMapping = options.customScalarTypeMapping?.[name];
    const mappedTypeName =
      typeof typeMapping === 'string' ? typeMapping : typeMapping?.name;

    const transformedName = this.getTransformedTypeName(name, options);

    return {
      kind: tsMorphLib.StructureKind.TypeAlias,
      name: transformedName,
      type: mappedTypeName ?? options.defaultScalarType ?? 'any',
      isExported: true,
    };
  }

  toEnumDefinitionStructure(
    item: EnumTypeDefinitionNode | EnumTypeExtensionNode,
    options: DefinitionsGeneratorOptions,
  ): TypeAliasDeclarationStructure | EnumDeclarationStructure {
    const name = get(item, 'name.value');
    if (!name) {
      return undefined;
    }
    const transformedName = this.getTransformedTypeName(name, options);

    if (options.enumsAsTypes) {
      const values = item.values.map(
        (value) => `"${get(value, 'name.value')}"`,
      );
      return {
        kind: tsMorphLib.StructureKind.TypeAlias,
        name: transformedName,
        type: values.join(' | '),
        isExported: true,
      };
    }
    const members = map(item.values, (value) => ({
      name: get(value, 'name.value'),
      value: get(value, 'name.value'),
    }));
    return {
      kind: tsMorphLib.StructureKind.Enum,
      name: transformedName,
      members,
      isExported: true,
    };
  }

  toUnionDefinitionStructure(
    item: UnionTypeDefinitionNode | UnionTypeExtensionNode,
    options: DefinitionsGeneratorOptions,
  ): TypeAliasDeclarationStructure {
    const name = get(item, 'name.value');
    if (!name) {
      return undefined;
    }
    const transformedName = this.getTransformedTypeName(name, options);

    const types: string[] = map(item.types, (value) => {
      const typeName = get(value, 'name.value');
      return typeName ? this.getTransformedTypeName(typeName, options) : null;
    }).filter(Boolean);

    return {
      kind: tsMorphLib.StructureKind.TypeAlias,
      name: transformedName,
      type: types.join(' | '),
      isExported: true,
    };
  }

  addSymbolIfRoot(name: string): string {
    return this.root.indexOf(name) >= 0 ? `I${name}` : name;
  }

  isRoot(name: string): boolean {
    return ['IQuery', 'IMutation', 'ISubscription'].indexOf(name) >= 0;
  }

  private getTransformedTypeName(
    name: string,
    options: DefinitionsGeneratorOptions,
  ): string {
    if (!options.typeName) {
      return name;
    }
    return options.typeName(name);
  }
}
