import * as ts from 'typescript';
import { SyntaxKind, isTypeReferenceNode, isArrayTypeNode, Identifier, Expression } from 'typescript';
import { HideField, ObjectType } from '../../decorators';
import { PluginOptions } from '../merge-options';
import { METADATA_FACTORY_NAME } from '../plugin-constants';
import {
  createBoolean,
  hasDecorators,
  hasModifiers,
  getJsDocDeprecation,
  getJSDocDescription,
} from '../utils/ast-utils';
import { getMemberTypeFromTypeChecker } from '../utils/plugin-utils';


export type MetadataTypeDef = {
  arrayType: boolean,
  typeName: string,
}

type MetadataDef = {
  propertyName: string,
  nullable: boolean,
  type: MetadataTypeDef,
  description?: string;
  deprecated?: string | boolean;
  // needImport?
  // specialType like ID and Float | Int ?
}


function getMemberTypeFromAst(node: ts.TypeNode): MetadataTypeDef {
  if (!node) {
    // todo: or throw new Error('Property should have an explicitly defined type!');
    return {
      typeName: 'Object',
      arrayType: false,
    }
  }

  if (isTypeReferenceNode(node)) {
    return {
      typeName: (node.typeName as Identifier).escapedText.toString(),
      arrayType: false,
    };
  }

  if (isArrayTypeNode(node)) {
    const metaType = getMemberTypeFromAst(node.elementType);

    return {
      ...metaType,
      arrayType: true,
    };
  }

  const mapping = {
    [SyntaxKind.StringKeyword]: 'String',
    [SyntaxKind.BooleanKeyword]: 'Boolean',
    [SyntaxKind.NumberKeyword]: 'Number',

    // todo: improve here to support string unions
    // [SyntaxKind.UnionType]: 'Object',
    // [SyntaxKind.AnyKeyword]: 'Object',
    // [SyntaxKind.UnknownKeyword]: 'Object',
    // [SyntaxKind.ObjectKeyword]: 'Object',
  };

  // if we were fail to discover type - fallback to Object
  return {
    typeName: mapping[node.kind] || 'Object',
    arrayType: false,
  };


  // todo: isPromiseOrObservable and add test case
  // todo union like 'foo' | 'bar'
  // todo Float | Integer
  // todo: Date | undefined
}

/**
 * create:
 *  { type: () => Number }
 */
function createTypePropertyAssignment(f: ts.NodeFactory, metadataType: MetadataTypeDef): ts.PropertyAssignment {
  const typeIdentifier = f.createIdentifier(metadataType.typeName);

  const fnBody = metadataType.arrayType
    ? f.createArrayLiteralExpression([typeIdentifier])
    : typeIdentifier;

  const typeArrowFn = f.createArrowFunction(undefined, undefined, undefined, undefined, undefined, fnBody);

  return f.createPropertyAssignment('type', typeArrowFn);
}

function createScalarPropertyAssigment(f: ts.NodeFactory, name: string, value: undefined | string | boolean): ts.PropertyAssignment {
  if (value === undefined) {
    return undefined;
  }

  let initializer: Expression;
  if (typeof value === 'string') {
    initializer = f.createStringLiteral(value);
  } else if (typeof value === 'boolean') {
    initializer = createBoolean(f, value)
  }

  return f.createPropertyAssignment(name, initializer);
}

export class ModelClassVisitor {
  visit(
    sourceFile: ts.SourceFile,
    ctx: ts.TransformationContext,
    program: ts.Program | undefined,
    pluginOptions: PluginOptions,
  ) {
    const f = ctx.factory;

    const typeChecker = program?.getTypeChecker();
    if (pluginOptions.advancedTypeIntrospection && !typeChecker) {
      throw new Error(
        'Type checker is not available while {advancedTypeIntrospection: true}. ' +
        'Probably you running you typescript compilation in transpileOnly mode ' +
        'or with isolatedModules in ts-jest'
      )
    }

    // ctx.
    const visitNode = (node: ts.Node): ts.Node => {
      // todo: here should be all types of decorators, or ask maintainers why it wasn't in original code
      if (ts.isClassDeclaration(node) && hasDecorators(node.decorators, [ObjectType.name])) {
        const propertiesMetadata = this.collectMetadataFromClassMembers(node.members, pluginOptions, typeChecker);
        return this.addMetadataFactory(node, propertiesMetadata, f);
      }

      return ts.visitEachChild(node, visitNode, ctx);
    };

    return ts.visitNode(sourceFile, visitNode);
  }

  private addMetadataFactory(node: ts.ClassDeclaration, propertiesMetadata: MetadataDef[], f: ts.NodeFactory) {
    const factoryProperties = propertiesMetadata.map((metadata) => {
      return f.createPropertyAssignment(
        metadata.propertyName,
        f.createObjectLiteralExpression([
          createTypePropertyAssignment(f, metadata.type),
          createScalarPropertyAssigment(f, 'nullable', metadata.nullable),
          createScalarPropertyAssigment(f, 'description', metadata.description),
          createScalarPropertyAssigment(f, 'deprecationReason', metadata.deprecated === true ? 'deprecated' : metadata.deprecated),
        ]));
    });

    const returnValue = f.createObjectLiteralExpression(factoryProperties, true);

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

    return f.updateClassDeclaration(node, node.decorators, node.modifiers, node.name, node.typeParameters, node.heritageClauses, [
      ...node.members,
      method,
    ]);
  }

  private collectMetadataFromClassMembers(
    members: ts.NodeArray<ts.ClassElement>,
    pluginOptions: PluginOptions,
    typeChecker: ts.TypeChecker | undefined,
  ): MetadataDef[] {
    const propertiesMetadata: MetadataDef[] = [];

    members.forEach((member) => {
      if (
        ts.isPropertyDeclaration(member)
        && !hasModifiers(member.modifiers, [SyntaxKind.StaticKeyword, SyntaxKind.PrivateKeyword])
        && !hasDecorators(member.decorators, [HideField.name])
      ) {
        // todo merge with existing annotations, what is the "existing declaration" ? Where they can be set?

        const metadataTypeDef = typeChecker
          ? getMemberTypeFromTypeChecker(member, typeChecker)
          : getMemberTypeFromAst(member.type);

        let description: string;
        let deprecated: string | boolean;

        if (pluginOptions.introspectComments) {
          description = getJSDocDescription(member);
          deprecated = getJsDocDeprecation(member);
        }

        const metadataDef: MetadataDef = {
          propertyName: (member.name as Identifier).getText(),
          type: metadataTypeDef,
          nullable: member.questionToken ? true : undefined,
          description,
          deprecated,
        };

        propertiesMetadata.push(metadataDef);
      }
    });

    return propertiesMetadata;
  }
}
