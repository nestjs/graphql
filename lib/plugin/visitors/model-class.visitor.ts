import { compact, flatten } from 'lodash';
import * as ts from 'typescript';
import { HideField } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import { findNullableTypeFromUnion, getDescriptionOfNode, isNull, isUndefined } from '../utils/ast-utils';
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

    const visitNode = (node: ts.Node): ts.Node => {
      if (ts.isClassDeclaration(node)) {
        this.clearMetadataOnRestart(node);

        node = ts.visitEachChild(node, visitNode, ctx);
        return this.addMetadataFactory(node as ts.ClassDeclaration);
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
            node,
            typeChecker,
            sourceFile.fileName,
            sourceFile,
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
        return this.updateImports(visitedNode, Array.from(importsToAdd));
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

  addMetadataFactory(node: ts.ClassDeclaration) {
    const classMutableNode = ts.getMutableClone(node);
    const classMetadata = this.getClassMetadata(node as ts.ClassDeclaration);
    const returnValue = classMetadata
      ? ts.createObjectLiteral(
          Object.keys(classMetadata).map((key) =>
            ts.createPropertyAssignment(
              ts.createIdentifier(key),
              classMetadata[key],
            ),
          ),
        )
      : ts.createObjectLiteral([], false);

    const method = ts.createMethod(
      undefined,
      [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
      undefined,
      ts.createIdentifier(METADATA_FACTORY_NAME),
      undefined,
      undefined,
      [],
      undefined,
      ts.createBlock([ts.createReturn(returnValue)], true),
    );
    (classMutableNode as any).members = ts.createNodeArray([
      ...(classMutableNode as ts.ClassDeclaration).members,
      method,
    ]);
    return classMutableNode;
  }

  inspectPropertyDeclaration(
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    sourceFile: ts.SourceFile,
    pluginOptions: PluginOptions,
  ) {
    const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(
      compilerNode,
      typeChecker,
      ts.createNodeArray(),
      hostFilename,
      sourceFile,
      pluginOptions,
    );
    this.addClassMetadata(compilerNode, objectLiteralExpr, sourceFile);
  }

  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = ts.createNodeArray(),
    hostFilename = '',
    sourceFile?: ts.SourceFile,
    pluginOptions?: PluginOptions,
  ): ts.ObjectLiteralExpression {
    const type = typeChecker.getTypeAtLocation(node);
    const isNullable = !!node.questionToken || isNull(type) || isUndefined(type);

    const properties = [
      ...existingProperties,
      !hasPropertyKey('nullable', existingProperties) && isNullable &&
        ts.createPropertyAssignment('nullable', ts.createLiteral(isNullable)),
      this.createTypePropertyAssignment(
        node.type,
        typeChecker,
        existingProperties,
        hostFilename,
        sourceFile,
        pluginOptions,
      ),
      this.createDescriptionPropertyAssigment(
        node,
        existingProperties,
        pluginOptions,
        sourceFile,
      ),
    ];
    const objectLiteral = ts.createObjectLiteral(compact(flatten(properties)));
    return objectLiteral;
  }

  createTypePropertyAssignment(
    node: ts.TypeNode,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string,
    sourceFile?: ts.SourceFile,
    pluginOptions?: PluginOptions
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
              member as ts.PropertySignature,
              typeChecker,
              existingProperties,
              hostFilename,
              sourceFile,
              pluginOptions,
            );
            return ts.createPropertyAssignment(
              ts.createIdentifier(member.name.getText()),
              literalExpr,
            );
          },
        );
        return ts.createPropertyAssignment(
          key,
          ts.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            ts.createParen(ts.createObjectLiteral(propertyAssignments)),
          ),
        );
      } else if (ts.isUnionTypeNode(node)) {
        const nullableType = findNullableTypeFromUnion(node, typeChecker);
        const remainingTypes = node.types.filter(
          (item) => item !== nullableType
        );

        if (remainingTypes.length === 1) {
          return this.createTypePropertyAssignment(
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

    return ts.createPropertyAssignment(
      key,
      ts.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        ts.createIdentifier(typeReference),
      ),
    );
  }

  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile,
  ) {
    const hostClass = node.parent;
    const className = hostClass.name && hostClass.name.getText();
    if (!className) {
      return;
    }
    const existingMetadata = metadataHostMap.get(className) || {};
    const propertyName = node.name && node.name.getText(sourceFile);
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
    sourceFile: ts.SourceFile,
    pathsToImport: string[],
  ): ts.SourceFile {
    const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);
    const IMPORT_PREFIX = 'eager_import_';
    const importDeclarations = pathsToImport.map((path, index) => {
      if (major == 4 && minor >= 2) {
        // support TS v4.2+
        return (ts.createImportEqualsDeclaration as any)(
          undefined,
          undefined,
          false,
          IMPORT_PREFIX + index,
          ts.createExternalModuleReference(ts.createLiteral(path)),
        );
      }
      return (ts.createImportEqualsDeclaration as any)(
        undefined,
        undefined,
        IMPORT_PREFIX + index,
        ts.createExternalModuleReference(ts.createLiteral(path)),
      );
    });
    return ts.updateSourceFileNode(sourceFile, [
      ...importDeclarations,
      ...sourceFile.statements,
    ]);
  }

  createDescriptionPropertyAssigment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    existingProperties: ts.NodeArray<ts.PropertyAssignment> = ts.createNodeArray(),
    options: PluginOptions = {},
    sourceFile?: ts.SourceFile,
  ): ts.PropertyAssignment {
    if (!options.introspectComments || !sourceFile) {
      return;
    }
    const description = getDescriptionOfNode(node, sourceFile);

    const keyOfComment = 'description';
    if (!hasPropertyKey(keyOfComment, existingProperties) && description) {
      const descriptionPropertyAssignment = ts.createPropertyAssignment(
        keyOfComment,
        ts.createLiteral(description),
      );
      return descriptionPropertyAssignment;
    }
  }
}
