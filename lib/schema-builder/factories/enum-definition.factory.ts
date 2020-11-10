import { Injectable } from '@nestjs/common';
import { GraphQLEnumType } from 'graphql';
import { EnumMetadata } from '../metadata';

export interface EnumDefinition {
  enumRef: object;
  type: GraphQLEnumType;
}

@Injectable()
export class EnumDefinitionFactory {
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
          };
          return prevValue;
        }, {}),
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
