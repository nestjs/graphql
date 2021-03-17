import { Injectable } from '@nestjs/common';
import { isEmpty } from '@nestjs/common/utils/shared.utils';
import {
  DirectiveNode,
  FieldDefinitionNode,
  GraphQLInputType,
  GraphQLOutputType,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
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
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
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
      kind: 'InputObjectTypeDefinition',
      name: {
        kind: 'Name',
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
      kind: 'InterfaceTypeDefinition',
      name: {
        kind: 'Name',
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
      kind: 'FieldDefinition',
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: type.toString(),
        },
      },
      name: {
        kind: 'Name',
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
      kind: 'InputValueDefinition',
      type: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: type.toString(),
        },
      },
      name: {
        kind: 'Name',
        value: name,
      },
      directives: directiveMetadata.map(this.createDirectiveNode),
    };
  }

  private createDirectiveNode(directive: DirectiveMetadata): DirectiveNode {
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
