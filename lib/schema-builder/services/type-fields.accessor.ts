import { Injectable } from '@nestjs/common';
import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import { omit } from 'lodash';

@Injectable()
export class TypeFieldsAccessor {
  extractFromInputType(
    gqlType: GraphQLInputObjectType,
  ): GraphQLInputFieldConfigMap {
    const fieldsMap = gqlType.getFields();
    const fieldsConfig: GraphQLInputFieldConfigMap = {};

    for (const key in fieldsMap) {
      const targetField = fieldsMap[key];
      fieldsConfig[key] = {
        type: targetField.type,
        description: targetField.description,
        defaultValue: targetField.defaultValue,
        astNode: targetField.astNode,
        extensions: targetField.extensions,
      };
    }
    return fieldsConfig;
  }

  extractFromInterfaceOrObjectType<T = any, U = any>(
    type: GraphQLInterfaceType | GraphQLObjectType,
  ): GraphQLFieldConfigMap<T, U> {
    const fieldsMap = type.getFields();
    const fieldsConfig: GraphQLFieldConfigMap<T, U> = {};

    for (const key in fieldsMap) {
      const targetField = fieldsMap[key];
      const args: GraphQLFieldConfigArgumentMap = {};
      targetField.args.forEach((item) => {
        args[item.name] = omit(item, 'name');
      });

      fieldsConfig[key] = {
        type: targetField.type,
        description: targetField.description,
        deprecationReason: targetField.deprecationReason,
        extensions: targetField.extensions,
        astNode: targetField.astNode,
        resolve: targetField.resolve,
        args,
      };
    }

    return fieldsConfig;
  }
}
