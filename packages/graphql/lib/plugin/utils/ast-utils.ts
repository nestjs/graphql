import * as ts from 'typescript';
import {
  CallExpression,
  Decorator,
  getJSDocDeprecatedTag,
  getJSDocTags,
  getTextOfJSDocComment,
  Identifier,
  JSDoc,
  LeftHandSideExpression,
  ModifiersArray,
  Node,
  NodeArray,
  ObjectFlags,
  ObjectType,
  PropertyAccessExpression,
  SyntaxKind,
  Type,
  TypeChecker,
  TypeFlags,
  TypeFormatFlags,
  TypeNode,
  UnionTypeNode,
} from 'typescript';
import { isDynamicallyAdded } from './plugin-utils';

const [tsVersionMajor, tsVersionMinor] = ts.versionMajorMinor
  ?.split('.')
  .map((x) => +x);
export const isInUpdatedAstContext = tsVersionMinor >= 8 || tsVersionMajor > 4;

export function getDecorators(node: ts.Node) {
  return isInUpdatedAstContext
    ? (ts.canHaveDecorators(node) && ts.getDecorators(node)) ?? []
    : node.decorators;
}

export function getModifiers(node: ts.Node) {
  return isInUpdatedAstContext
    ? (ts.canHaveModifiers(node) && ts.getModifiers(node)) ?? []
    : node.modifiers;
}

export function isArray(type: Type) {
  const symbol = type.getSymbol();
  if (!symbol) {
    return false;
  }
  return symbol.getName() === 'Array' && getTypeArguments(type).length === 1;
}

export function getTypeArguments(type: Type) {
  return (type as any).typeArguments || [];
}

export function isBoolean(type: Type) {
  return hasFlag(type, TypeFlags.Boolean);
}

export function isString(type: Type) {
  return hasFlag(type, TypeFlags.String);
}

export function isNumber(type: Type) {
  return hasFlag(type, TypeFlags.Number);
}

export function isInterface(type: Type) {
  return hasObjectFlag(type, ObjectFlags.Interface);
}

export function isEnum(type: Type) {
  const hasEnumFlag = hasFlag(type, TypeFlags.Enum);
  if (hasEnumFlag) {
    return true;
  }
  if (isEnumLiteral(type)) {
    return false;
  }
  const symbol = type.getSymbol();
  if (!symbol) {
    return false;
  }
  const valueDeclaration = symbol.valueDeclaration;
  if (!valueDeclaration) {
    return false;
  }
  return valueDeclaration.kind === SyntaxKind.EnumDeclaration;
}

export function isEnumLiteral(type: Type) {
  return hasFlag(type, TypeFlags.EnumLiteral) && !type.isUnion();
}

export function isNull(type: Type) {
  if (type.isUnion()) {
    return Boolean(type.types.find((t) => hasFlag(t, TypeFlags.Null)));
  } else {
    return hasFlag(type, TypeFlags.Null);
  }
}

export function isUndefined(type: Type) {
  if (type.isUnion()) {
    return Boolean(type.types.find((t) => hasFlag(t, TypeFlags.Undefined)));
  } else {
    return hasFlag(type, TypeFlags.Undefined);
  }
}

export function hasFlag(type: Type, flag: TypeFlags) {
  return (type.flags & flag) === flag;
}

export function hasObjectFlag(type: Type, flag: ObjectFlags) {
  return ((type as ObjectType).objectFlags & flag) === flag;
}

export function getText(
  type: Type,
  typeChecker: TypeChecker,
  enclosingNode?: Node,
  typeFormatFlags?: TypeFormatFlags,
) {
  if (!typeFormatFlags) {
    typeFormatFlags = getDefaultTypeFormatFlags(enclosingNode);
  }
  const compilerNode = !enclosingNode ? undefined : enclosingNode;
  return typeChecker.typeToString(type, compilerNode, typeFormatFlags);
}

export function getDefaultTypeFormatFlags(enclosingNode: Node) {
  let formatFlags =
    TypeFormatFlags.UseTypeOfFunction |
    TypeFormatFlags.NoTruncation |
    TypeFormatFlags.UseFullyQualifiedType |
    TypeFormatFlags.WriteTypeArgumentsOfSignature;
  if (enclosingNode && enclosingNode.kind === SyntaxKind.TypeAliasDeclaration)
    formatFlags |= TypeFormatFlags.InTypeAlias;
  return formatFlags;
}

export function getDecoratorArguments(decorator: Decorator) {
  const callExpression = decorator.expression;
  return (callExpression && (callExpression as CallExpression).arguments) || [];
}

export function getDecoratorName(decorator: Decorator) {
  const isDecoratorFactory =
    decorator.expression.kind === SyntaxKind.CallExpression;
  if (isDecoratorFactory) {
    const callExpression = decorator.expression;
    const identifier = (callExpression as CallExpression)
      .expression as Identifier;
    if (isDynamicallyAdded(identifier)) {
      return undefined;
    }
    return getIdentifierFromName(
      (callExpression as CallExpression).expression,
    ).getText();
  }
  return getIdentifierFromName(decorator.expression).getText();
}

function getIdentifierFromName(expression: LeftHandSideExpression) {
  const identifier = getNameFromExpression(expression);
  if (expression && expression.kind !== SyntaxKind.Identifier) {
    throw new Error();
  }
  return identifier;
}

function getNameFromExpression(expression: LeftHandSideExpression) {
  if (expression && expression.kind === SyntaxKind.PropertyAccessExpression) {
    return (expression as PropertyAccessExpression).name;
  }
  return expression;
}

export function getJSDocDescription(node: Node): string {
  const jsDoc: JSDoc[] = (node as any).jsDoc;

  if (!jsDoc) {
    return undefined;
  }

  return getTextOfJSDocComment(jsDoc[0].comment);
}

export function hasJSDocTags(node: Node, tagName: string[]): boolean {
  const tags = getJSDocTags(node);
  return tags.some((tag) => tagName.includes(tag.tagName.text));
  // return jsDoc;
}

export function getJsDocDeprecation(node: Node): string {
  const deprecatedTag = getJSDocDeprecatedTag(node);
  if (!deprecatedTag) {
    return undefined;
  }
  return getTextOfJSDocComment(deprecatedTag.comment) || 'deprecated';
}

export function findNullableTypeFromUnion(
  typeNode: UnionTypeNode,
  typeChecker: TypeChecker,
) {
  return typeNode.types.find((tNode: TypeNode) =>
    hasFlag(typeChecker.getTypeAtLocation(tNode), TypeFlags.Null),
  );
}

export function hasModifiers(
  modifiers: ModifiersArray | readonly ts.Modifier[],
  toCheck: SyntaxKind[],
): boolean {
  if (!modifiers) {
    return false;
  }
  return modifiers.some((modifier) => toCheck.includes(modifier.kind));
}

export function hasDecorators(
  decorators: NodeArray<Decorator> | readonly Decorator[],
  toCheck: string[],
): boolean {
  if (!decorators) {
    return false;
  }

  return decorators.some((decorator) => {
    return toCheck.includes(getDecoratorName(decorator));
  });
}

export function hasImport(sf: ts.SourceFile, what: string): boolean {
  for (const statement of sf.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      const bindings = statement.importClause.namedBindings.elements;

      for (const namedBinding of bindings) {
        if (namedBinding.name.text === what) {
          return true;
        }
      }
    }
  }
  return false;
}

export function createImportEquals(
  f: ts.NodeFactory,
  identifier: ts.Identifier | string,
  from: string,
): ts.ImportEqualsDeclaration {
  const [major, minor] = ts.versionMajorMinor?.split('.').map((x) => +x);

  if (major >= 4 && minor >= 2) {
    // support TS v4.2+
    return minor >= 8
      ? f.createImportEqualsDeclaration(
          undefined,
          false,
          identifier,
          f.createExternalModuleReference(f.createStringLiteral(from)),
        )
      : f.createImportEqualsDeclaration(
          undefined,
          undefined,
          false,
          identifier,
          f.createExternalModuleReference(f.createStringLiteral(from)),
        );
  }
  return (f.createImportEqualsDeclaration as any)(
    undefined,
    undefined,
    identifier,
    f.createExternalModuleReference(f.createStringLiteral(from)),
  );
}

export function createNamedImport(
  f: ts.NodeFactory,
  what: string[],
  from: string,
) {
  const importClause = f.createImportClause(
    false,
    undefined,
    f.createNamedImports(
      what.map((name) =>
        f.createImportSpecifier(false, undefined, f.createIdentifier(name)),
      ),
    ),
  );
  return isInUpdatedAstContext
    ? f.createImportDeclaration(
        undefined,
        importClause,
        f.createStringLiteral(from),
      )
    : f.createImportDeclaration(
        undefined,
        undefined,
        importClause,
        f.createStringLiteral(from),
      );
}

export function isCallExpressionOf(name: string, node: ts.CallExpression) {
  return ts.isIdentifier(node.expression) && node.expression.text === name;
}

export type PrimitiveObject = {
  [key: string]: string | boolean | ts.Node | PrimitiveObject;
};

function isNode(value: any): value is ts.Node {
  return typeof value === 'object' && value.constructor.name === 'NodeObject';
}

export function serializePrimitiveObjectToAst(
  f: ts.NodeFactory,
  object: PrimitiveObject,
): ts.ObjectLiteralExpression {
  const properties = [];

  Object.keys(object).forEach((key) => {
    const value = object[key];

    if (value === undefined) {
      return;
    }

    let initializer: ts.Expression;
    if (isNode(value)) {
      initializer = value as ts.Expression;
    } else if (typeof value === 'string') {
      initializer = f.createStringLiteral(value);
    } else if (typeof value === 'boolean') {
      initializer = value ? f.createTrue() : f.createFalse();
    } else if (typeof value === 'object') {
      initializer = serializePrimitiveObjectToAst(f, value);
    }

    properties.push(f.createPropertyAssignment(key, initializer));
  });

  return f.createObjectLiteralExpression(properties);
}

export function safelyMergeObjects(
  f: ts.NodeFactory,
  a: ts.Expression,
  b: ts.Expression,
) {
  // if both of objects are ObjectLiterals, so merge property by property in compile time
  // if one or both of expressions not an object literal, produce rest spread and merge in runtime
  if (ts.isObjectLiteralExpression(a) && ts.isObjectLiteralExpression(b)) {
    const aMap = a.properties.reduce((acc, prop) => {
      acc[(prop.name as ts.Identifier).text] = prop;
      return acc;
    }, {} as { [propName: string]: ts.ObjectLiteralElementLike });

    b.properties.forEach((prop) => {
      aMap[(prop.name as ts.Identifier).text] = prop;
    }, {});

    return f.createObjectLiteralExpression(Object.values(aMap));
  } else {
    return f.createObjectLiteralExpression([
      f.createSpreadAssignment(a),
      f.createSpreadAssignment(b),
    ]);
  }
}

export function updateDecoratorArguments<
  T extends
    | ts.ClassDeclaration
    | ts.PropertyDeclaration
    | ts.GetAccessorDeclaration,
>(
  f: ts.NodeFactory,
  node: T,
  decoratorName: string,
  replaceFn: (
    decoratorArguments: ts.NodeArray<ts.Expression>,
  ) => ts.Expression[],
): T {
  let updated = false;

  const nodeOriginalDecorators = getDecorators(node);
  const decorators = nodeOriginalDecorators.map((decorator) => {
    if (getDecoratorName(decorator) !== decoratorName) {
      return decorator;
    }

    const decoratorExpression = decorator.expression as ts.CallExpression;
    updated = true;
    return f.updateDecorator(
      decorator,
      f.updateCallExpression(
        decoratorExpression,
        decoratorExpression.expression,
        decoratorExpression.typeArguments,
        replaceFn(decoratorExpression.arguments),
      ),
    );
  });

  if (!updated) {
    return node;
  }

  if (ts.isClassDeclaration(node)) {
    return (
      isInUpdatedAstContext
        ? f.updateClassDeclaration(
            node,
            [...decorators, ...getModifiers(node)],
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members,
          )
        : (f.updateClassDeclaration as any)(
            node,
            decorators,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members,
          )
    ) as T;
  }

  if (ts.isPropertyDeclaration(node)) {
    return (
      isInUpdatedAstContext
        ? f.updatePropertyDeclaration(
            node,
            [...decorators, ...getModifiers(node)],
            node.name,
            node.questionToken,
            node.type,
            node.initializer,
          )
        : (f.updatePropertyDeclaration as any)(
            node,
            decorators,
            node.modifiers,
            node.name,
            node.questionToken,
            node.type,
            node.initializer,
          )
    ) as T;
  }

  if (ts.isGetAccessorDeclaration(node)) {
    return (
      isInUpdatedAstContext
        ? f.updateGetAccessorDeclaration(
            node,
            [...decorators, ...getModifiers(node)],
            node.name,
            node.parameters,
            node.type,
            node.body,
          )
        : (f.updateGetAccessorDeclaration as any)(
            node,
            decorators,
            node.modifiers,
            node.name,
            node.parameters,
            node.type,
            node.body,
          )
    ) as T;
  }
}
