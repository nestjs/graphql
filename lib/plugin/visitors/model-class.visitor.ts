import { compact, flatten } from 'lodash';
import * as ts from 'typescript';
import { HideField } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import {
  findNullableTypeFromUnion,
  isNull,
  isUndefined,
  getJSDocDescription,
  getJsDocDeprecation,
} from '../utils/ast-utils';
import {
  getDecoratorOrUndefinedByNames,
  getTypeReferenceAsString,
  hasPropertyKey,
  replaceImportPath,
} from '../utils/plugin-utils';

const metadataHostMap = new Map();
const importsToAddPerFile = new Map<string, Set<string>>();

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
      if (ts.isClassDeclaration(node)) {
        this.clearMetadataOnRestart(node);

        node = ts.visitEachChild(node, visitNode, ctx);
        return this.addMetadataFactory(factory, node as ts.ClassDeclaration);
      } else if (ts.isPropertyDeclaration(node)) {
        const decorators = node.decorators;
        const hideField = getDecoratorOrUndefinedByNames(
          [HideField.name],
          decorators,
        );
        if (hideField) {
          return node;
        }
        const isPropertyStatic = (node.modifiers || []).some(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
        );
        if (isPropertyStatic) {
          return node;
        }
        try {
          this.inspectPropertyDeclaration(
            factory,
            node,
            typeChecker,
            sourceFile.fileName,
            pluginOptions,
          );
        } catch (err) {
          return node;
        }
        return node;
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

  clearMetadataOnRestart(node: ts.ClassDeclaration) {
    const classMetadata = this.getClassMetadata(node);
    if (classMetadata) {
      metadataHostMap.delete(node.name.getText());
    }
  }

  addMetadataFactory(f: ts.NodeFactory, node: ts.ClassDeclaration) {
    const classMetadata = this.getClassMetadata(node as ts.ClassDeclaration);
    const returnValue = classMetadata
      ? f.createObjectLiteralExpression(
          Object.keys(classMetadata).map((key) =>
            f.createPropertyAssignment(
              f.createIdentifier(key),
              classMetadata[key],
            ),
          ),
        )
      : f.createObjectLiteralExpression([], false);

    const method = f.createMethodDeclaration(
      undefined,
      [f.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined,
      f.createIdentifier(METADATA_FACTORY_NAME),
      undefined,
      undefined,
      [],
      undefined,
      f.createBlock([f.createReturnStatement(returnValue)], true),
    );

    return f.createClassDeclaration(
      node.decorators,
      node.modifiers,
      node.name,
      node.typeParameters,
      node.heritageClauses,
      [...node.members, method],
    );
  }

  inspectPropertyDeclaration(
    f: ts.NodeFactory,
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    pluginOptions: PluginOptions,
  ) {
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      f,
      compilerNode,
      typeChecker,
      f.createNodeArray(),
      hostFilename,
      pluginOptions,
    );
    this.addClassMetadata(compilerNode, objectLiteralExpr);
  }

  createDecoratorObjectLiteralExpr(
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

  createTypePropertyAssignment(
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

  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
  ) {
    const hostClass = node.parent;
    const className = hostClass.name && hostClass.name.getText();
    if (!className) {
      return;
    }
    const existingMetadata = metadataHostMap.get(className) || {};
    const propertyName = node.name && node.name.getText();
    if (
      !propertyName ||
      (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)
    ) {
      return;
    }
    metadataHostMap.set(className, {
      ...existingMetadata,
      [propertyName]: objectLiteral,
    });
  }

  getClassMetadata(node: ts.ClassDeclaration) {
    if (!node.name) {
      return;
    }
    return metadataHostMap.get(node.name.getText());
  }

  updateImports(
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

  createScalarPropertyAssigment(
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

  createDescriptionPropertyAssigment(
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

  createDeprecationReasonPropertyAssigment(
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
