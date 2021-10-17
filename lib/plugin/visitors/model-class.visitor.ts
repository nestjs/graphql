import { compact, flatten } from 'lodash';
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
} from '../utils/ast-utils';
import {
  getTypeReferenceAsString,
  hasPropertyKey,
  replaceImportPath,
} from '../utils/plugin-utils';

const importsToAddPerFile = new Map<string, Set<string>>();

const ALLOWED_DECORATORS = [
  ObjectType.name,
  InterfaceType.name,
  InputType.name,
];

export class ModelClassVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
    pluginOptions: PluginOptions,
  ) {
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
      } else if (ts.isSourceFile(node)) {
        const visitedNode = ts.visitEachChild(node, visitNode, ctx);
        const importsToAdd = importsToAddPerFile.get(node.fileName);
        if (!importsToAdd) {
          return visitedNode;
        }
        return this.updateImports(
          factory,
          visitedNode,
          Array.from(importsToAdd),
        );
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

    if (!description) {
      return node.decorators;
    }

    // get one of allowed decorators from list
    return node.decorators.map((decorator) => {
      if (!ALLOWED_DECORATORS.includes(getDecoratorName(decorator))) {
        return decorator;
      }

      const decoratorExpression = decorator.expression as ts.CallExpression;
      const objectLiteralExpression = f.createObjectLiteralExpression([
        f.createPropertyAssignment(
          'description',
          f.createStringLiteral(description),
        ),
      ]);

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
            return f.createObjectLiteralExpression([
              f.createSpreadAssignment(objectLiteralExpression),
              f.createSpreadAssignment(argument),
            ]);
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
        try {
          const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
            f,
            member,
            typeChecker,
            f.createNodeArray(),
            hostFilename,
            pluginOptions,
          );

          properties.push(
            f.createPropertyAssignment(
              f.createIdentifier(member.name.getText()),
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
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename = '',
    pluginOptions?: PluginOptions,
  ): ts.ObjectLiteralExpression {
    const type = typeChecker.getTypeAtLocation(node);
    const isNullable =
      !!node.questionToken || isNull(type) || isUndefined(type);

    const properties = [
      ...existingProperties,
      isNullable
        ? this.createScalarPropertyAssigment(
            f,
            'nullable',
            isNullable,
            existingProperties,
          )
        : undefined,
      this.createTypePropertyAssignment(
        f,
        node.type,
        typeChecker,
        existingProperties,
        hostFilename,
        pluginOptions,
      ),
      this.createDescriptionPropertyAssigment(
        f,
        node,
        existingProperties,
        pluginOptions,
      ),
      this.createDeprecationReasonPropertyAssigment(
        f,
        node,
        existingProperties,
        pluginOptions,
      ),
    ];
    const objectLiteral = f.createObjectLiteralExpression(
      compact(flatten(properties)),
    );
    return objectLiteral;
  }

  private createTypePropertyAssignment(
    f: ts.NodeFactory,
    node: ts.TypeNode,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string,
    pluginOptions?: PluginOptions,
  ): ts.PropertyAssignment {
    const key = 'type';
    if (hasPropertyKey(key, existingProperties)) {
      return undefined;
    }

    if (node) {
      if (ts.isTypeLiteralNode(node)) {
        const propertyAssignments = Array.from(node.members || []).map(
          (member) => {
            const literalExpr = this.createDecoratorObjectLiteralExpr(
              f,
              member as ts.PropertySignature,
              typeChecker,
              existingProperties,
              hostFilename,
              pluginOptions,
            );
            return f.createPropertyAssignment(
              f.createIdentifier(member.name.getText()),
              literalExpr,
            );
          },
        );
        return f.createPropertyAssignment(
          key,
          f.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            f.createParenthesizedExpression(
              f.createObjectLiteralExpression(propertyAssignments),
            ),
          ),
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
            existingProperties,
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

    return f.createPropertyAssignment(
      key,
      f.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        f.createIdentifier(typeReference),
      ),
    );
  }

  private updateImports(
    f: ts.NodeFactory,
    sourceFile: ts.SourceFile,
    pathsToImport: string[],
  ): ts.SourceFile {
    const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);
    const IMPORT_PREFIX = 'eager_import_';
    const importDeclarations = pathsToImport.map((path, index) => {
      if (major == 4 && minor >= 2) {
        // support TS v4.2+
        return (f.createImportEqualsDeclaration as any)(
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

    return f.updateSourceFile(sourceFile, [
      ...importDeclarations,
      ...sourceFile.statements,
    ]);
  }

  private createScalarPropertyAssigment(
    f: ts.NodeFactory,
    name: string,
    value: undefined | string | boolean,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
  ): ts.PropertyAssignment {
    if (value === undefined || hasPropertyKey(name, existingProperties)) {
      return undefined;
    }

    let initializer: ts.Expression;
    if (typeof value === 'string') {
      initializer = f.createStringLiteral(value);
    } else if (typeof value === 'boolean') {
      initializer = value ? f.createTrue() : f.createFalse();
    }

    return f.createPropertyAssignment(name, initializer);
  }

  private createDescriptionPropertyAssigment(
    f: ts.NodeFactory,
    node: ts.PropertyDeclaration | ts.PropertySignature,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    options: PluginOptions = {},
  ): ts.PropertyAssignment {
    if (!options.introspectComments) {
      return;
    }

    const description = getJSDocDescription(node);

    return this.createScalarPropertyAssigment(
      f,
      'description',
      description,
      existingProperties,
    );
  }

  private createDeprecationReasonPropertyAssigment(
    f: ts.NodeFactory,
    node: ts.PropertyDeclaration | ts.PropertySignature,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    options: PluginOptions = {},
  ): ts.PropertyAssignment {
    if (!options.introspectComments) {
      return;
    }

    const deprecation = getJsDocDeprecation(node);

    return this.createScalarPropertyAssigment(
      f,
      'deprecationReason',
      deprecation,
      existingProperties,
    );
  }
}
