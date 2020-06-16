import * as ts from 'typescript';
export declare class ModelClassVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program,
  ): ts.SourceFile;
  clearMetadataOnRestart(node: ts.ClassDeclaration): void;
  addMetadataFactory(node: ts.ClassDeclaration): ts.ClassDeclaration;
  inspectPropertyDeclaration(
    compilerNode: ts.PropertyDeclaration,
    typeChecker: ts.TypeChecker,
    hostFilename: string,
    sourceFile: ts.SourceFile,
  ): void;
  createDecoratorObjectLiteralExpr(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties?: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename?: string,
  ): ts.ObjectLiteralExpression;
  createTypePropertyAssignment(
    node: ts.PropertyDeclaration | ts.PropertySignature,
    typeChecker: ts.TypeChecker,
    existingProperties: ts.NodeArray<ts.PropertyAssignment>,
    hostFilename: string,
  ): ts.PropertyAssignment;
  addClassMetadata(
    node: ts.PropertyDeclaration,
    objectLiteral: ts.ObjectLiteralExpression,
    sourceFile: ts.SourceFile,
  ): void;
  getClassMetadata(node: ts.ClassDeclaration): any;
  updateImports(
    sourceFile: ts.SourceFile,
    pathsToImport: string[],
  ): ts.SourceFile;
}
