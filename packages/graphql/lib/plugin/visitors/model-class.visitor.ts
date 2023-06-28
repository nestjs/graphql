import { posix } from 'path';
import * as ts from 'typescript';
import {
  ArgsType,
  Field,
  HideField,
  InputType,
  InterfaceType,
  ObjectType,
} from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import { pluginDebugLogger } from '../plugin-debug-logger';
import {
  createImportEquals,
  findNullableTypeFromUnion,
  getDecoratorName,
  getDecorators,
  getJSDocDescription,
  getJsDocDeprecation,
  getModifiers,
  hasDecorators,
  hasModifiers,
  isNull,
  isUndefined,
  safelyMergeObjects,
  serializePrimitiveObjectToAst,
  updateDecoratorArguments,
} from '../utils/ast-utils';
import { convertPath, getTypeReferenceAsString } from '../utils/plugin-utils';
import { typeReferenceToIdentifier } from '../utils/type-reference-to-identifier.util';

const CLASS_DECORATORS = [
  ObjectType.name,
  InterfaceType.name,
  InputType.name,
  ArgsType.name,
];

type ClassMetadata = Record<string, ts.ObjectLiteralExpression>;

export class ModelClassVisitor {
  private importsToAdd: Set<string>;
  private readonly _typeImports: Record<string, string> = {};
  private readonly _collectedMetadata: Record<string, ClassMetadata> = {};

  get typeImports() {
    return this._typeImports;
  }

  get collectedMetadata(): Array<
    [ts.CallExpression, Record<string, ClassMetadata>]
  > {
    const metadataWithImports = [];
    Object.keys(this._collectedMetadata).forEach((filePath) => {
      const metadata = this._collectedMetadata[filePath];
      const path = filePath.replace(/\.[jt]s$/, '');
      const importExpr = ts.factory.createCallExpression(
        ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as ts.Expression,
        undefined,
        [ts.factory.createStringLiteral(path)],
      );
      metadataWithImports.push([importExpr, metadata]);
    });
    return metadataWithImports;
  }

  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    pluginOptions: PluginOptions,
  ) {
    this.importsToAdd = new Set<string>();

    const typeChecker = program.getTypeChecker();
    const factory = ctx.factory;

    const visitNode = (node: ts.Node): ts.Node => {
      const decorators = getDecorators(node);
      if (
        ts.isClassDeclaration(node) &&
        hasDecorators(decorators, CLASS_DECORATORS)
      ) {
        const isExported = node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        );
        if (pluginOptions.readonly && !isExported) {
          if (pluginOptions.debug) {
            pluginDebugLogger.debug(
              `Skipping class "${node.name.getText()}" because it's not exported.`,
            );
          }
          return;
        }
        const [members, amendedMetadata] = this.amendFieldsDecorators(
          factory,
          node.members,
          pluginOptions,
          sourceFile.fileName,
          typeChecker,
        );

        const metadata = this.collectMetadataFromClassMembers(
          factory,
          members,
          pluginOptions,
          sourceFile.fileName,
          typeChecker,
        );

        if (!pluginOptions.readonly) {
          return this.updateClassDeclaration(
            factory,
            node,
            members,
            metadata,
            pluginOptions,
          );
        } else {
          const filePath = this.normalizeImportPath(
            pluginOptions.pathToSource,
            sourceFile.fileName,
          );
          if (!this._collectedMetadata[filePath]) {
            this._collectedMetadata[filePath] = {};
          }
          const attributeKey = node.name.getText();
          this._collectedMetadata[filePath][attributeKey] = safelyMergeObjects(
            factory,
            metadata,
            amendedMetadata,
          );
          return;
        }
      } else if (ts.isSourceFile(node) && !pluginOptions.readonly) {
        const visitedNode = ts.visitEachChild(node, visitNode, ctx);

        const importStatements: ts.Statement[] =
          this.createEagerImports(factory);

        const existingStatements = Array.from(visitedNode.statements);
        return factory.updateSourceFile(visitedNode, [
          ...importStatements,
          ...existingStatements,
        ]);
      }
      if (pluginOptions.readonly) {
        ts.forEachChild(node, visitNode);
      } else {
        return ts.visitEachChild(node, visitNode, ctx);
      }
    };
    return ts.visitNode(sourceFile, visitNode);
  }

  private addDescriptionToClassDecorators(
    f: ts.NodeFactory,
    node: ts.ClassDeclaration,
  ) {
    const description = getJSDocDescription(node);
    const decorators = getDecorators(node);
    if (!description) {
      return decorators;
    }

    // get one of allowed decorators from list
    return decorators.map((decorator) => {
      if (!CLASS_DECORATORS.includes(getDecoratorName(decorator))) {
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

  private amendFieldsDecorators(
    f: ts.NodeFactory,
    members: ts.NodeArray<ts.ClassElement>,
    pluginOptions: PluginOptions,
    hostFilename: string, // sourceFile.fileName,
    typeChecker: ts.TypeChecker | undefined,
  ): [ts.ClassElement[], ts.ObjectLiteralExpression] {
    const propertyAssignments: ts.PropertyAssignment[] = [];
    const updatedClassElements = members.map((member) => {
      const decorators = getDecorators(member);
      if (
        (ts.isPropertyDeclaration(member) || ts.isGetAccessor(member)) &&
        hasDecorators(decorators, [Field.name])
      ) {
        try {
          return updateDecoratorArguments(
            f,
            member,
            Field.name,
            (decoratorArguments) => {
              const options =
                this.getOptionsFromFieldDecoratorOrUndefined(
                  decoratorArguments,
                );

              const { type, ...metadata } = this.createFieldMetadata(
                f,
                member,
                typeChecker,
                hostFilename,
                pluginOptions,
                this.getTypeFromFieldDecoratorOrUndefined(decoratorArguments),
              );

              const serializedMetadata = serializePrimitiveObjectToAst(
                f,
                metadata as any,
              );

              propertyAssignments.push(
                f.createPropertyAssignment(
                  f.createIdentifier(member.name.getText()),
                  serializedMetadata,
                ),
              );
              return [
                type,
                options
                  ? safelyMergeObjects(f, serializedMetadata, options)
                  : serializedMetadata,
              ];
            },
          );
        } catch (e) {
          // omit error
        }
      }

      return member;
    });

    return [
      updatedClassElements,
      f.createObjectLiteralExpression(propertyAssignments),
    ];
  }

  private collectMetadataFromClassMembers(
    f: ts.NodeFactory,
    members: ts.ClassElement[],
    pluginOptions: PluginOptions,
    hostFilename: string, // sourceFile.fileName,
    typeChecker: ts.TypeChecker | undefined,
  ): ts.ObjectLiteralExpression {
    const properties: ts.PropertyAssignment[] = [];

    members.forEach((member) => {
      const decorators = getDecorators(member);
      const modifiers = getModifiers(member);
      if (
        (ts.isPropertyDeclaration(member) || ts.isGetAccessor(member)) &&
        !hasModifiers(modifiers as readonly ts.Modifier[], [
          ts.SyntaxKind.StaticKeyword,
          ts.SyntaxKind.PrivateKeyword,
        ]) &&
        !hasDecorators(decorators, [HideField.name, Field.name])
      ) {
        try {
          const metadata = this.createFieldMetadata(
            f,
            member,
            typeChecker,
            hostFilename,
            pluginOptions,
          );

          properties.push(
            f.createPropertyAssignment(
              f.createIdentifier(member.name.getText()),
              serializePrimitiveObjectToAst(f, metadata),
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
    members: ts.ClassElement[],
    propsMetadata: ts.ObjectLiteralExpression,
    pluginOptions: PluginOptions,
  ) {
    const method = f.createMethodDeclaration(
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
      : getDecorators(node);

    return f.updateClassDeclaration(
      node,
      [...decorators, ...getModifiers(node)],
      node.name,
      node.typeParameters,
      node.heritageClauses,
      [...members, method],
    );
  }

  private getOptionsFromFieldDecoratorOrUndefined(
    decoratorArguments: ts.NodeArray<ts.Expression>,
  ): ts.Expression | undefined {
    if (decoratorArguments.length > 1) {
      return decoratorArguments[1];
    }

    if (
      decoratorArguments.length === 1 &&
      !ts.isArrowFunction(decoratorArguments[0])
    ) {
      return decoratorArguments[0];
    }
  }

  private getTypeFromFieldDecoratorOrUndefined(
    decoratorArguments: ts.NodeArray<ts.Expression>,
  ): ts.ArrowFunction | undefined {
    if (
      decoratorArguments.length > 0 &&
      ts.isArrowFunction(decoratorArguments[0])
    ) {
      return decoratorArguments[0];
    }
  }

  private createFieldMetadata(
    f: ts.NodeFactory,
    node: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename = '',
    pluginOptions: PluginOptions = {},
    typeArrowFunction?: ts.ArrowFunction,
  ) {
    const type = typeChecker.getTypeAtLocation(node);
    const isNullable =
      !!node.questionToken || isNull(type) || isUndefined(type);

    if (!typeArrowFunction) {
      typeArrowFunction =
        typeArrowFunction ||
        f.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          this.getTypeUsingTypeChecker(
            f,
            node.type,
            typeChecker,
            hostFilename,
            pluginOptions,
          ),
        );
    }

    const description = pluginOptions.introspectComments
      ? getJSDocDescription(node)
      : undefined;

    const deprecationReason = pluginOptions.introspectComments
      ? getJsDocDeprecation(node)
      : undefined;

    return {
      nullable: isNullable || undefined,
      type: typeArrowFunction,
      description,
      deprecationReason,
    };
  }

  private getTypeUsingTypeChecker(
    f: ts.NodeFactory,
    node: ts.TypeNode,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    options: PluginOptions,
  ) {
    if (node && ts.isUnionTypeNode(node)) {
      const nullableType = findNullableTypeFromUnion(node, typeChecker);
      const remainingTypes = node.types.filter((item) => item !== nullableType);

      if (remainingTypes.length === 1) {
        return this.getTypeUsingTypeChecker(
          f,
          remainingTypes[0],
          typeChecker,
          hostFilename,
          options,
        );
      }
    }

    const type = typeChecker.getTypeAtLocation(node);
    if (!type) {
      return undefined;
    }

    const typeReferenceDescriptor = getTypeReferenceAsString(type, typeChecker);
    if (!typeReferenceDescriptor.typeName) {
      return undefined;
    }

    return typeReferenceToIdentifier(
      typeReferenceDescriptor,
      hostFilename,
      options,
      f,
      type,
      this._typeImports,
      this.importsToAdd,
    );
  }

  private createEagerImports(f: ts.NodeFactory): ts.ImportEqualsDeclaration[] {
    if (!this.importsToAdd.size) {
      return [];
    }

    return Array.from(this.importsToAdd).map((path, index) => {
      return createImportEquals(f, 'eager_import_' + index, path);
    });
  }

  private normalizeImportPath(pathToSource: string, path: string) {
    let relativePath = posix.relative(
      convertPath(pathToSource),
      convertPath(path),
    );
    relativePath = relativePath[0] !== '.' ? './' + relativePath : relativePath;
    return relativePath;
  }
}
