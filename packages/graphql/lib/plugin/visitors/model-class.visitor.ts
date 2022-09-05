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
import {
  createImportEquals,
  findNullableTypeFromUnion,
  getDecoratorName,
  getDecorators,
  getJsDocDeprecation,
  getJSDocDescription,
  getModifiers,
  hasDecorators,
  hasModifiers,
  isInUpdatedAstContext,
  isNull,
  isUndefined,
  safelyMergeObjects,
  serializePrimitiveObjectToAst,
  updateDecoratorArguments,
} from '../utils/ast-utils';
import {
  getTypeReferenceAsString,
  replaceImportPath,
} from '../utils/plugin-utils';

const CLASS_DECORATORS = [
  ObjectType.name,
  InterfaceType.name,
  InputType.name,
  ArgsType.name,
];

export class ModelClassVisitor {
  private importsToAdd: Set<string>;

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
        const members = this.amendFieldsDecorators(
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

        return this.updateClassDeclaration(
          factory,
          node,
          members,
          metadata,
          pluginOptions,
        );
      } else if (ts.isSourceFile(node)) {
        const visitedNode = ts.visitEachChild(node, visitNode, ctx);

        const importStatements: ts.Statement[] =
          this.createEagerImports(factory);

        const existingStatements = Array.from(visitedNode.statements);
        return factory.updateSourceFile(visitedNode, [
          ...importStatements,
          ...existingStatements,
        ]);
      }
      return ts.visitEachChild(node, visitNode, ctx);
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
  ): ts.ClassElement[] {
    return members.map((member) => {
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
    const method = isInUpdatedAstContext
      ? f.createMethodDeclaration(
          [f.createModifier(ts.SyntaxKind.StaticKeyword)],
          undefined,
          f.createIdentifier(METADATA_FACTORY_NAME),
          undefined,
          undefined,
          [],
          undefined,
          f.createBlock([f.createReturnStatement(propsMetadata)], true),
        )
      : f.createMethodDeclaration(
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
      : getDecorators(node);

    return isInUpdatedAstContext
      ? f.updateClassDeclaration(
          node,
          [...decorators, ...getModifiers(node)],
          node.name,
          node.typeParameters,
          node.heritageClauses,
          [...members, method],
        )
      : (f.updateClassDeclaration as any)(
          node,
          decorators,
          node.modifiers,
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
    pluginOptions?: PluginOptions,
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
          this.getTypeUsingTypeChecker(f, node.type, typeChecker, hostFilename),
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
        );
      }
    }

    const type = typeChecker.getTypeAtLocation(node);
    if (!type) {
      return undefined;
    }

    const _typeReference = getTypeReferenceAsString(type, typeChecker);

    if (!_typeReference) {
      return undefined;
    }

    const { typeReference, importPath } = replaceImportPath(
      _typeReference,
      hostFilename,
    );

    if (importPath) {
      // add top-level import to eagarly load class metadata
      this.importsToAdd.add(importPath);
    }

    return f.createIdentifier(typeReference);
  }

  private createEagerImports(f: ts.NodeFactory): ts.ImportEqualsDeclaration[] {
    if (!this.importsToAdd.size) {
      return [];
    }

    return Array.from(this.importsToAdd).map((path, index) => {
      return createImportEquals(f, 'eager_import_' + index, path);
    });
  }
}
