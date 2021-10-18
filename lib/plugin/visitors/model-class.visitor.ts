import * as ts from 'typescript';
import {
  HideField,
  ObjectType,
  InterfaceType,
  InputType,
} from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import {
  findNullableTypeFromUnion,
  isNull,
  isUndefined,
  getJSDocDescription,
  getJsDocDeprecation,
  hasDecorators,
  hasModifiers,
  getDecoratorName,
  createNamedImport,
  isCallExpressionOf,
  serializePrimitiveObjectToAst,
  safelyMergeObjects,
  hasJSDocTags,
  PrimitiveObject,
} from '../utils/ast-utils';
import {
  getTypeReferenceAsString,
  replaceImportPath,
} from '../utils/plugin-utils';
import { EnumMetadataValuesMapOptions } from '../../schema-builder/metadata';
import { EnumOptions } from '../../type-factories';

const importsToAddPerFile = new Map<string, Set<string>>();

const ALLOWED_DECORATORS = [
  ObjectType.name,
  InterfaceType.name,
  InputType.name,
];

type EnumMetadata = {
  name: string;
  description: string;
  properties: { [name: string]: EnumMetadataValuesMapOptions };
};

function capitalizeFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export class ModelClassVisitor {
  inlineEnumsMap: { name: string; values: { [name: string]: string } }[];
  enumsMetadata: Map<ts.EnumDeclaration, EnumMetadata>;

  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    pluginOptions: PluginOptions,
  ) {
    this.inlineEnumsMap = [];
    this.enumsMetadata = new Map();

    const typeChecker = program.getTypeChecker();
    const factory = ctx.factory;

    const visitNode = (node: ts.Node): ts.Node => {
      if (
        ts.isClassDeclaration(node) &&
        hasDecorators(node.decorators, ALLOWED_DECORATORS)
      ) {
        const metadata = this.collectMetadataFromClassMembers(
          factory,
          node.members,
          pluginOptions,
          sourceFile.fileName,
          typeChecker,
        );

        return this.updateClassDeclaration(
          factory,
          node,
          metadata,
          pluginOptions,
        );
      } else if (
        ts.isEnumDeclaration(node) &&
        !hasJSDocTags(node, ['private', 'HideEnum']) &&
        pluginOptions.autoRegisterEnums
      ) {
        this.enumsMetadata.set(
          node,
          this.collectMetadataFromEnum(node, pluginOptions),
        );
        return node;
      } else if (ts.isCallExpression(node)) {
        if (isCallExpressionOf('registerEnumType', node)) {
          return this.amendRegisterEnumTypeCall(factory, node);
        }

        if (isCallExpressionOf('createUnionType', node)) {
          return this.amendCreateUnionTypeCall(factory, node);
        }
      } else if (ts.isSourceFile(node)) {
        const visitedNode = ts.visitEachChild(node, visitNode, ctx);

        const importStatements: ts.Statement[] = this.createEagerImports(
          factory,
          node.fileName,
        );

        const implicitEnumsStatements = this.createImplicitEnums(factory);

        if (implicitEnumsStatements.length || this.enumsMetadata.size) {
          importStatements.push(
            createNamedImport(factory, ['registerEnumType'], '@nestjs/graphql'),
          );
        }

        const existingStatements = Array.from(visitedNode.statements);

        this.enumsMetadata.forEach((metadata, enumDeclaration) => {
          const registration = this.createEnumRegistration(factory, metadata);
          const enumIndex = existingStatements.indexOf(enumDeclaration);
          existingStatements.splice(enumIndex + 1, 0, registration);
        });

        return factory.updateSourceFile(visitedNode, [
          ...importStatements,
          ...implicitEnumsStatements,
          ...existingStatements,
        ]);
      }
      return ts.visitEachChild(node, visitNode, ctx);
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  private collectMetadataFromEnum(
    node: ts.EnumDeclaration,
    pluginOptions: PluginOptions,
  ): EnumMetadata {
    let properties: EnumMetadata['properties'] = {};
    let description: string;

    if (pluginOptions.introspectComments) {
      properties = node.members.reduce<EnumMetadata['properties']>(
        (acc, member) => {
          const deprecationReason = getJsDocDeprecation(member);
          const description = getJSDocDescription(member);

          if (deprecationReason || description) {
            acc[(member.name as ts.Identifier).text] = {
              deprecationReason: getJsDocDeprecation(member),
              description: getJSDocDescription(member),
            };
          }

          return acc;
        },
        {},
      );

      description = getJSDocDescription(node);
    }

    return {
      name: node.name.text,
      description,
      properties,
    };
  }

  private createEnumRegistration(f: ts.NodeFactory, metadata: EnumMetadata) {
    const registerEnumTypeOptions: EnumOptions = {
      name: metadata.name,
      description: metadata.description,
      valuesMap: metadata.properties,
    };

    return f.createExpressionStatement(
      f.createCallExpression(
        f.createIdentifier('registerEnumType'),
        undefined,
        [
          // create enum itself as object literal
          f.createIdentifier(metadata.name),
          // create an options with name of enum
          serializePrimitiveObjectToAst(
            f,
            registerEnumTypeOptions as unknown as PrimitiveObject,
          ),
        ],
      ),
    );
  }

  private amendCreateUnionTypeCall(f: ts.NodeFactory, node: ts.CallExpression) {
    if (!ts.isVariableDeclaration(node.parent) || node.arguments.length != 1) {
      return node;
    }

    const unionName = (node.parent.name as ts.Identifier).text;

    return f.updateCallExpression(node, node.expression, node.typeArguments, [
      safelyMergeObjects(
        f,
        serializePrimitiveObjectToAst(f, {
          name: unionName,
        }),
        node.arguments[0],
      ),
    ]);
  }

  private amendRegisterEnumTypeCall(
    f: ts.NodeFactory,
    node: ts.CallExpression,
  ) {
    if (node.arguments.length === 0 || !ts.isIdentifier(node.arguments[0])) {
      return node;
    }

    const enumName = node.arguments[0].text;
    const objectLiteralExpression = serializePrimitiveObjectToAst(f, {
      name: enumName,
    });

    let newArgumentsArray: ts.Expression[];

    if (node.arguments.length === 1) {
      newArgumentsArray = [node.arguments[0], objectLiteralExpression];
    } else {
      newArgumentsArray = [
        node.arguments[0],
        safelyMergeObjects(f, objectLiteralExpression, node.arguments[1]),
      ];
    }

    return f.updateCallExpression(
      node,
      node.expression,
      node.typeArguments,
      newArgumentsArray,
    );
  }

  private addDescriptionToClassDecorators(
    f: ts.NodeFactory,
    node: ts.ClassDeclaration,
  ) {
    const description = getJSDocDescription(node);

    if (!description) {
      return node.decorators;
    }

    // get one of allowed decorators from list
    return node.decorators.map((decorator) => {
      if (!ALLOWED_DECORATORS.includes(getDecoratorName(decorator))) {
        return decorator;
      }

      const decoratorExpression = decorator.expression as ts.CallExpression;
      const objectLiteralExpression = serializePrimitiveObjectToAst(f, {
        description,
      });

      let newArgumentsArray: ts.Expression[] = [];

      if (decoratorExpression.arguments.length === 0) {
        newArgumentsArray = [objectLiteralExpression];
      } else {
        // Options always a last parameter:
        // @ObjectType('name', {description: ''});
        // @ObjectType({description: ''});

        newArgumentsArray = decoratorExpression.arguments.map(
          (argument, index) => {
            if (index + 1 != decoratorExpression.arguments.length) {
              return argument;
            }

            // merge existing props with new props
            return safelyMergeObjects(f, objectLiteralExpression, argument);
          },
        );
      }

      return f.updateDecorator(
        decorator,
        f.updateCallExpression(
          decoratorExpression,
          decoratorExpression.expression,
          decoratorExpression.typeArguments,
          newArgumentsArray,
        ),
      );
    });
  }

  private isMemberHasInlineStringEnum(
    member: ts.PropertyDeclaration,
  ): false | { [name: string]: string } {
    if (!member.type || !ts.isUnionTypeNode(member.type)) {
      return false;
    }

    const values: { [name: string]: string } = {};

    for (const type of member.type.types) {
      if (!ts.isLiteralTypeNode(type)) {
        return false;
      }

      if (type.literal.kind === ts.SyntaxKind.StringLiteral) {
        values[type.literal.text.replace(/\s/g, '_')] = type.literal.text;
        continue;
      }

      if (type.literal.kind !== ts.SyntaxKind.NullKeyword) {
        return false;
      }
    }

    return values;
  }

  private createImplicitEnums(f: ts.NodeFactory): ts.ExpressionStatement[] {
    return this.inlineEnumsMap.map(({ name, values }) => {
      return f.createExpressionStatement(
        f.createCallExpression(
          f.createIdentifier('registerEnumType'),
          undefined,
          [
            // create enum itself as object literal
            serializePrimitiveObjectToAst(f, values),
            // create an options with name of enum
            serializePrimitiveObjectToAst(f, { name }),
          ],
        ),
      );
    });
  }

  private collectMetadataFromClassMembers(
    f: ts.NodeFactory,
    members: ts.NodeArray<ts.ClassElement>,
    pluginOptions: PluginOptions,
    hostFilename: string, // sourceFile.fileName,
    typeChecker: ts.TypeChecker | undefined,
  ): ts.ObjectLiteralExpression {
    const properties: ts.PropertyAssignment[] = [];

    members.forEach((member) => {
      if (
        ts.isPropertyDeclaration(member) &&
        !hasModifiers(member.modifiers, [
          ts.SyntaxKind.StaticKeyword,
          ts.SyntaxKind.PrivateKeyword,
        ]) &&
        !hasDecorators(member.decorators, [HideField.name])
      ) {
        let inlineEnumName: string;
        const memberName = member.name.getText();

        const membersStringEnumValues =
          this.isMemberHasInlineStringEnum(member);

        if (membersStringEnumValues) {
          inlineEnumName =
            member.parent.name.getText() +
            capitalizeFirstLetter(memberName) +
            'Enum';

          this.inlineEnumsMap.push({
            name: inlineEnumName,
            values: membersStringEnumValues,
          });
        }

        try {
          const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
            f,
            member,
            typeChecker,
            inlineEnumName,
            hostFilename,
            pluginOptions,
          );

          properties.push(
            f.createPropertyAssignment(
              f.createIdentifier(memberName),
              objectLiteralExpr,
            ),
          );
        } catch (e) {
          // omit error
        }
      }
    });

    return f.createObjectLiteralExpression(properties);
  }

  private updateClassDeclaration(
    f: ts.NodeFactory,
    node: ts.ClassDeclaration,
    propsMetadata: ts.ObjectLiteralExpression,
    pluginOptions: PluginOptions,
  ) {
    const method = f.createMethodDeclaration(
      undefined,
      [f.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined,
      f.createIdentifier(METADATA_FACTORY_NAME),
      undefined,
      undefined,
      [],
      undefined,
      f.createBlock([f.createReturnStatement(propsMetadata)], true),
    );

    const decorators = pluginOptions.introspectComments
      ? this.addDescriptionToClassDecorators(f, node)
      : node.decorators;

    return f.updateClassDeclaration(
      node,
      decorators,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      [...node.members, method],
    );
  }

  private createDecoratorObjectLiteralExpr(
    f: ts.NodeFactory,
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    overrideType?: string,
    hostFilename = '',
    pluginOptions?: PluginOptions,
  ): ts.ObjectLiteralExpression {
    const type = typeChecker.getTypeAtLocation(node);
    const isNullable =
      !!node.questionToken || isNull(type) || isUndefined(type);

    const typeArrowFunction = f.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      overrideType
        ? f.createIdentifier(overrideType)
        : this.createTypePropertyAssignment(
            f,
            node.type,
            typeChecker,
            hostFilename,
            pluginOptions,
          ),
    );

    const description = pluginOptions.introspectComments
      ? getJSDocDescription(node)
      : undefined;

    const deprecationReason = pluginOptions.introspectComments
      ? getJsDocDeprecation(node)
      : undefined;

    const objectLiteral = serializePrimitiveObjectToAst(f, {
      nullable: isNullable || undefined,
      type: typeArrowFunction,
      description,
      deprecationReason,
    });

    return objectLiteral;
  }

  private createTypePropertyAssignment(
    f: ts.NodeFactory,
    node: ts.TypeNode,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    pluginOptions?: PluginOptions,
  ) {
    if (node) {
      if (ts.isTypeLiteralNode(node)) {
        const propertyAssignments = Array.from(node.members || []).map(
          (member) => {
            const literalExpr = this.createDecoratorObjectLiteralExpr(
              f,
              member as ts.PropertySignature,
              typeChecker,
              undefined,
              hostFilename,
              pluginOptions,
            );
            return f.createPropertyAssignment(
              f.createIdentifier(member.name.getText()),
              literalExpr,
            );
          },
        );
        return f.createParenthesizedExpression(
          f.createObjectLiteralExpression(propertyAssignments),
        );
      } else if (ts.isUnionTypeNode(node)) {
        const nullableType = findNullableTypeFromUnion(node, typeChecker);
        const remainingTypes = node.types.filter(
          (item) => item !== nullableType,
        );

        if (remainingTypes.length === 1) {
          return this.createTypePropertyAssignment(
            f,
            remainingTypes[0],
            typeChecker,
            hostFilename,
          );
        }
      }
    }

    const type = typeChecker.getTypeAtLocation(node);
    if (!type) {
      return undefined;
    }

    let typeReference = getTypeReferenceAsString(type, typeChecker);
    if (!typeReference) {
      return undefined;
    }
    typeReference = replaceImportPath(typeReference, hostFilename);
    if (typeReference && typeReference.includes('require')) {
      // add top-level import to eagarly load class metadata
      const importPath = /\(\"([^)]).+(\")/.exec(typeReference)[0];
      if (importPath) {
        let importsToAdd = importsToAddPerFile.get(hostFilename);
        if (!importsToAdd) {
          importsToAdd = new Set();
          importsToAddPerFile.set(hostFilename, importsToAdd);
        }
        importsToAdd.add(importPath.slice(2, importPath.length - 1));
      }
    }

    return f.createIdentifier(typeReference);
  }

  private createEagerImports(
    f: ts.NodeFactory,
    fileName: string,
  ): ts.ImportEqualsDeclaration[] {
    const importsToAdd = importsToAddPerFile.get(fileName);

    if (!importsToAdd) {
      return [];
    }

    const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);
    const IMPORT_PREFIX = 'eager_import_';

    return Array.from(importsToAdd).map((path, index) => {
      if (major == 4 && minor >= 2) {
        // support TS v4.2+
        return f.createImportEqualsDeclaration(
          undefined,
          undefined,
          false,
          IMPORT_PREFIX + index,
          f.createExternalModuleReference(f.createStringLiteral(path)),
        );
      }
      return (f.createImportEqualsDeclaration as any)(
        undefined,
        undefined,
        IMPORT_PREFIX + index,
        f.createExternalModuleReference(f.createStringLiteral(path)),
      );
    });
  }
}
