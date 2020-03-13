import * as ts from 'typescript';
import {
  GRAPHQL_PACKAGE_NAME,
  GRAPHQL_PACKAGE_NAMESPACE,
} from '../plugin-constants';

export class AbstractFileVisitor {
  updateImports(sourceFile: ts.SourceFile): ts.SourceFile {
    return ts.updateSourceFileNode(sourceFile, [
      ts.createImportEqualsDeclaration(
        undefined,
        undefined,
        GRAPHQL_PACKAGE_NAMESPACE,
        ts.createExternalModuleReference(
          ts.createLiteral(GRAPHQL_PACKAGE_NAME),
        ),
      ),
      ...sourceFile.statements,
    ]);
  }
}
