import { Injectable } from '@nestjs/common';
import { GraphQLEnumType } from 'graphql';
import { EnumMetadata } from '../metadata/index.js';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory.js';

export interface EnumDefinition {
  enumRef: object;
  type: GraphQLEnumType;
}

@Injectable()
export class EnumDefinitionFactory {
  constructor(
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
  ) {}

  public create(metadata: EnumMetadata): EnumDefinition {
    const enumValues = this.getEnumValues(metadata.ref);

    return {
      enumRef: metadata.ref,
      type: new GraphQLEnumType({
        name: metadata.name,
        description: metadata.description,
        values: Object.keys(enumValues).reduce((prevValue, key) => {
          const valueMap = metadata.valuesMap[key];
          prevValue[key] = {
            value: enumValues[key],
            description: valueMap?.description,
            deprecationReason: valueMap?.deprecationReason,
            /**
             * AST node has to be manually created in order to define directives
             * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
             */
            astNode: this.astDefinitionNodeFactory.createEnumValueNode(
              key,
              valueMap?.directives,
            ),
          };
          return prevValue;
        }, {}),
        /**
         * AST node has to be manually created in order to define directives
         * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
         */
        astNode: this.astDefinitionNodeFactory.createEnumTypeNode(
          metadata.name,
          metadata.directives,
        ),
      }),
    };
  }

  private getEnumValues(enumObject: Record<string, any>) {
    const enumKeys = Object.keys(enumObject).filter((key) =>
      isNaN(parseInt(key, 10)),
    );
    return enumKeys.reduce((prev, nextKey) => {
      prev[nextKey] = enumObject[nextKey];
      return prev;
    }, {});
  }
}
