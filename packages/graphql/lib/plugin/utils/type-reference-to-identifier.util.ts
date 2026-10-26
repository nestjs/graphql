import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';
import { pluginDebugLogger } from '../plugin-debug-logger.js';
import { getTypeArguments, isArray } from './ast-utils.js';
import { convertPath, replaceImportPath } from './plugin-utils.js';

export function typeReferenceToIdentifier(
  typeReferenceDescriptor: {
    typeName: string;
    isArray?: boolean;
    arrayDepth?: number;
  },
  hostFilename: string,
  options: PluginOptions,
  factory: ts.NodeFactory,
  type: ts.Type,
  typeImports: Record<string, string>,
  importsToAdd: Set<string>,
  hoistedTypeImports: Map<string, string>,
) {
  if (options.readonly) {
    assertReferenceableType(
      type,
      typeReferenceDescriptor.typeName,
      hostFilename,
      options,
    );
  }

  const { typeReference, importPath, typeName } = replaceImportPath(
    typeReferenceDescriptor.typeName,
    hostFilename,
    options,
  );

  let identifier: ts.Identifier;
  if (importPath && !options.readonly && !options.esmCompatible) {
    // Add top-level import to eagarly load class metadata
    importsToAdd.add(importPath);
  }
  if (options.readonly && typeReference?.includes('import')) {
    if (!typeImports[importPath]) {
      typeImports[importPath] = typeReference;
    }

    let ref = `t["${importPath}"].${typeName}`;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  } else if (
    !options.readonly &&
    options.esmCompatible &&
    typeName &&
    importPath
  ) {
    // In an ES module the reference must be a static namespace import: a
    // hoisted "require" would break on self-references and import cycles
    // (ERR_REQUIRE_CYCLE_MODULE), and "require" is not available at all.
    const elementType = unwrapArrayType(type, typeReferenceDescriptor);
    let ref = isSameFileType(elementType, hostFilename)
      ? typeName
      : `${hoistTypeImport(importPath, hoistedTypeImports)}.${typeName}`;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  } else {
    let ref = typeReference;
    if (typeReferenceDescriptor.isArray) {
      ref = wrapTypeInArray(ref, typeReferenceDescriptor.arrayDepth);
    }
    identifier = factory.createIdentifier(ref);
  }
  return identifier;
}

function hoistTypeImport(
  importPath: string,
  hoistedTypeImports: Map<string, string>,
) {
  let namespaceName = hoistedTypeImports.get(importPath);
  if (!namespaceName) {
    namespaceName = `eager_import_${hoistedTypeImports.size}`;
    hoistedTypeImports.set(importPath, namespaceName);
  }
  return namespaceName;
}

function unwrapArrayType(
  type: ts.Type,
  typeReferenceDescriptor: { arrayDepth?: number },
) {
  let elementType = type;
  for (
    let depth = typeReferenceDescriptor.arrayDepth ?? 0;
    depth > 0;
    depth--
  ) {
    if (!isArray(elementType)) {
      break;
    }
    const typeArgument = getTypeArguments(elementType)[0];
    if (!typeArgument) {
      break;
    }
    elementType = typeArgument;
  }
  return elementType;
}

/**
 * Whether the type is declared in the file currently being transformed. Such
 * types are referenced by their local binding instead of importing the module
 * into itself.
 */
function isSameFileType(type: ts.Type, hostFilename: string) {
  if (!type?.symbol?.declarations) {
    return false;
  }
  const normalizedHost = convertPath(hostFilename);
  return type.symbol.declarations.some((declaration) => {
    const declarationFile = declaration.getSourceFile();
    return (
      convertPath(declarationFile.fileName) === normalizedHost &&
      !declarationFile.isDeclarationFile
    );
  });
}

function wrapTypeInArray(typeRef: string, arrayDepth: number) {
  for (let i = 0; i < arrayDepth; i++) {
    typeRef = `[${typeRef}]`;
  }
  return typeRef;
}

function assertReferenceableType(
  type: ts.Type,
  parsedTypeName: string,
  hostFilename: string,
  options: PluginOptions,
) {
  if (!type.symbol) {
    return true;
  }
  if (!(type.symbol as any).isReferenced) {
    return true;
  }
  if (parsedTypeName.includes('import')) {
    return true;
  }
  const errorMessage = `Type "${parsedTypeName}" is not referenceable ("${hostFilename}"). To fix this, make sure to export this type.`;
  if (options.debug) {
    pluginDebugLogger.debug(errorMessage);
  }
  throw new Error(errorMessage);
}
