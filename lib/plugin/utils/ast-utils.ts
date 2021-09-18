import * as ts from 'typescript';
import { CallExpression, Decorator, LeftHandSideExpression, PropertyAccessExpression, SyntaxKind } from 'typescript';


export function getDecoratorName(decorator: Decorator) {
  const isDecoratorFactory =
    decorator.expression.kind === SyntaxKind.CallExpression;
  if (isDecoratorFactory) {
    const callExpression = decorator.expression;
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

export function hasModifiers(modifiers: ts.ModifiersArray, toCheck: SyntaxKind[]): boolean {
  if (!modifiers) {
    return false;
  }
  return modifiers.some((modifier) => toCheck.includes(modifier.kind));
}

export function hasDecorators(decorators: ts.NodeArray<ts.Decorator>, toCheck: string[]): boolean {
  if (!decorators) {
    return false;
  }

  return decorators.some((decorator) => {
    return toCheck.includes(getDecoratorName(decorator));
  });
}

export function createBoolean(f: ts.NodeFactory, boolean: Boolean) {
  return boolean ? f.createTrue() : f.createFalse();
}

export function getJSDocDescription(node: ts.Node): string {
  const jsDoc: ts.JSDoc[] = (node as any).jsDoc;

  if (!jsDoc) {
    return undefined;
  }

  return ts.getTextOfJSDocComment(jsDoc[0].comment);
}

export function getJsDocDeprecation(node: ts.Node): string | boolean {
  const deprecatedTag = ts.getJSDocDeprecatedTag(node);
  if (!deprecatedTag) {
    return undefined;
  }
  return ts.getTextOfJSDocComment(deprecatedTag.comment) || !!deprecatedTag;
}
