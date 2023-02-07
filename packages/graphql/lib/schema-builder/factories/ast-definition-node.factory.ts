import { Injectable } from '@nestjs/common';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import {
  ConstDirectiveNode,
  FieldDefinitionNode,
  GraphQLInputType,
  GraphQLOutputType,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  parse,
} from 'graphql';
import { head } from 'lodash';

import { DirectiveParsingError } from '../errors/directive-parsing.error';
import { DirectiveMetadata } from '../metadata/directive.metadata';

@Injectable()
export class AstDefinitionNodeFactory {
  /**
   * The implementation of this class has been heavily inspired by the folllowing code:
   * @ref https://github.com/MichalLytek/type-graphql/blob/master/src/schema/definition-node.ts
   * implemented in this PR https://github.com/MichalLytek/type-graphql/pull/369 by Jordan Stous (https://github.com/j)
   */

  createObjectTypeNode(
    name: string,
    directiveMetadata?: DirectiveMetadata[],
  ): ObjectTypeDefinitionNode | undefined {
    if (isEmpty(directiveMetadata)) {
      return;
    }
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  createInputObjectTypeNode(
    name: string,
    directiveMetadata?: DirectiveMetadata[],
  ): InputObjectTypeDefinitionNode | undefined {
    if (isEmpty(directiveMetadata)) {
      return;
    }

    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  createInterfaceTypeNode(
    name: string,
    directiveMetadata?: DirectiveMetadata[],
  ): InterfaceTypeDefinitionNode | undefined {
    if (isEmpty(directiveMetadata)) {
      return;
    }

    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      name: {
        kind: Kind.NAME,
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  createFieldNode(
    name: string,
    type: GraphQLOutputType,
    directiveMetadata?: DirectiveMetadata[],
  ): FieldDefinitionNode | undefined {
    if (isEmpty(directiveMetadata)) {
      return;
    }

    return {
      kind: Kind.FIELD_DEFINITION,
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: type.toString(),
        },
      },
      name: {
        kind: Kind.NAME,
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  createInputValueNode(
    name: string,
    type: GraphQLInputType,
    directiveMetadata?: DirectiveMetadata[],
  ): InputValueDefinitionNode | undefined {
    if (isEmpty(directiveMetadata)) {
      return;
    }

    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: type.toString(),
        },
      },
      name: {
        kind: Kind.NAME,
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  private createDirectiveNode(
    directive: DirectiveMetadata,
  ): ConstDirectiveNode {
    const parsed = parse(`type String ${directive.sdl}`);
    const definitions = parsed.definitions as ObjectTypeDefinitionNode[];
    const directives = definitions
      .filter((item) => item.directives && item.directives.length > 0)
      .map(({ directives }) => directives)
      .reduce((acc, item) => [...acc, ...item]);

    if (directives.length !== 1) {
      throw new DirectiveParsingError(directive.sdl);
    }
    return head(directives);
  }
}
