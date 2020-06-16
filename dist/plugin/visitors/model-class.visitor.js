"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelClassVisitor = void 0;
const lodash_1 = require("lodash");
const ts = require("typescript");
const decorators_1 = require("../../decorators");
const plugin_constants_1 = require("../plugin-constants");
const plugin_utils_1 = require("../utils/plugin-utils");
const metadataHostMap = new Map();
const importsToAddPerFile = new Map();
class ModelClassVisitor {
    visit(sourceFile, ctx, program) {
        const typeChecker = program.getTypeChecker();
        const visitNode = (node) => {
            if (ts.isClassDeclaration(node)) {
                this.clearMetadataOnRestart(node);
                node = ts.visitEachChild(node, visitNode, ctx);
                return this.addMetadataFactory(node);
            }
            else if (ts.isPropertyDeclaration(node)) {
                const decorators = node.decorators;
                const hideField = plugin_utils_1.getDecoratorOrUndefinedByNames([decorators_1.HideField.name], decorators);
                if (hideField) {
                    return node;
                }
                const isPropertyStatic = (node.modifiers || []).some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
                if (isPropertyStatic) {
                    return node;
                }
                try {
                    this.inspectPropertyDeclaration(node, typeChecker, sourceFile.fileName, sourceFile);
                }
                catch (err) {
                    return node;
                }
                return node;
            }
            else if (ts.isSourceFile(node)) {
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
    clearMetadataOnRestart(node) {
        const classMetadata = this.getClassMetadata(node);
        if (classMetadata) {
            metadataHostMap.delete(node.name.getText());
        }
    }
    addMetadataFactory(node) {
        const classMutableNode = ts.getMutableClone(node);
        const classMetadata = this.getClassMetadata(node);
        const returnValue = classMetadata
            ? ts.createObjectLiteral(Object.keys(classMetadata).map((key) => ts.createPropertyAssignment(ts.createIdentifier(key), classMetadata[key])))
            : ts.createObjectLiteral([], false);
        const method = ts.createMethod(undefined, [ts.createModifier(ts.SyntaxKind.StaticKeyword)], undefined, ts.createIdentifier(plugin_constants_1.METADATA_FACTORY_NAME), undefined, undefined, [], undefined, ts.createBlock([ts.createReturn(returnValue)], true));
        classMutableNode.members = ts.createNodeArray([
            ...classMutableNode.members,
            method,
        ]);
        return classMutableNode;
    }
    inspectPropertyDeclaration(compilerNode, typeChecker, hostFilename, sourceFile) {
        const objectLiteralExpr = this.createDecoratorObjectLiteralExpr(compilerNode, typeChecker, ts.createNodeArray(), hostFilename);
        this.addClassMetadata(compilerNode, objectLiteralExpr, sourceFile);
    }
    createDecoratorObjectLiteralExpr(node, typeChecker, existingProperties = ts.createNodeArray(), hostFilename = '') {
        const isRequired = !node.questionToken;
        const properties = [
            ...existingProperties,
            !plugin_utils_1.hasPropertyKey('nullable', existingProperties) &&
                ts.createPropertyAssignment('nullable', ts.createLiteral(!isRequired)),
            this.createTypePropertyAssignment(node, typeChecker, existingProperties, hostFilename),
        ];
        const objectLiteral = ts.createObjectLiteral(lodash_1.compact(lodash_1.flatten(properties)));
        return objectLiteral;
    }
    createTypePropertyAssignment(node, typeChecker, existingProperties, hostFilename) {
        const key = 'type';
        if (plugin_utils_1.hasPropertyKey(key, existingProperties)) {
            return undefined;
        }
        const type = typeChecker.getTypeAtLocation(node);
        if (!type) {
            return undefined;
        }
        if (node.type && ts.isTypeLiteralNode(node.type)) {
            const propertyAssignments = Array.from(node.type.members || []).map((member) => {
                const literalExpr = this.createDecoratorObjectLiteralExpr(member, typeChecker, existingProperties, hostFilename);
                return ts.createPropertyAssignment(ts.createIdentifier(member.name.getText()), literalExpr);
            });
            return ts.createPropertyAssignment(key, ts.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.createParen(ts.createObjectLiteral(propertyAssignments))));
        }
        let typeReference = plugin_utils_1.getTypeReferenceAsString(type, typeChecker);
        if (!typeReference) {
            return undefined;
        }
        typeReference = plugin_utils_1.replaceImportPath(typeReference, hostFilename);
        if (typeReference && typeReference.includes('require')) {
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
        return ts.createPropertyAssignment(key, ts.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.createIdentifier(typeReference)));
    }
    addClassMetadata(node, objectLiteral, sourceFile) {
        const hostClass = node.parent;
        const className = hostClass.name && hostClass.name.getText();
        if (!className) {
            return;
        }
        const existingMetadata = metadataHostMap.get(className) || {};
        const propertyName = node.name && node.name.getText(sourceFile);
        if (!propertyName ||
            (node.name && node.name.kind === ts.SyntaxKind.ComputedPropertyName)) {
            return;
        }
        metadataHostMap.set(className, Object.assign(Object.assign({}, existingMetadata), { [propertyName]: objectLiteral }));
    }
    getClassMetadata(node) {
        if (!node.name) {
            return;
        }
        return metadataHostMap.get(node.name.getText());
    }
    updateImports(sourceFile, pathsToImport) {
        const IMPORT_PREFIX = 'eager_import_';
        const importDeclarations = pathsToImport.map((path, index) => ts.createImportEqualsDeclaration(undefined, undefined, IMPORT_PREFIX + index, ts.createExternalModuleReference(ts.createLiteral(path))));
        return ts.updateSourceFileNode(sourceFile, [
            ...importDeclarations,
            ...sourceFile.statements,
        ]);
    }
}
exports.ModelClassVisitor = ModelClassVisitor;
