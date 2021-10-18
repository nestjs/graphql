import { mergeSchemas } from '@graphql-tools/merge';
import { Injectable } from '@nestjs/common';
import { loadPackage } from '@nestjs/common/utils/load-package.util';
import { isString } from '@nestjs/common/utils/shared.utils';
import { gql } from 'apollo-server-core';
import {
  GraphQLAbstractType,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { forEach, isEmpty } from 'lodash';
import { GraphQLSchemaBuilder } from '../graphql-schema.builder';
import { GraphQLSchemaHost } from '../graphql-schema.host';
import { GqlModuleOptions } from '../interfaces';
import {
  PluginsExplorerService,
  ResolversExplorerService,
  ScalarsExplorerService,
} from '../services';
import { extend } from '../utils';
import { transformSchema } from '../utils/transform-schema.util';

@Injectable()
export class GraphQLFederationFactory {
  constructor(
    private readonly resolversExplorerService: ResolversExplorerService,
    private readonly scalarsExplorerService: ScalarsExplorerService,
    private readonly pluginsExplorerService: PluginsExplorerService,
    private readonly gqlSchemaBuilder: GraphQLSchemaBuilder,
    private readonly gqlSchemaHost: GraphQLSchemaHost,
  ) {}

  async mergeOptions(
    options: GqlModuleOptions = {},
  ): Promise<GqlModuleOptions> {
    const transformSchema = async (schema) =>
      options.transformSchema ? options.transformSchema(schema) : schema;

    options.plugins = extend(
      options.plugins || [],
      this.pluginsExplorerService.explore(),
    );

    let schema: GraphQLSchema;
    if (options.autoSchemaFile) {
      schema = await this.generateSchema(options);
    } else if (isEmpty(options.typeDefs)) {
      schema = options.schema;
    } else {
      schema = this.buildSchemaFromTypeDefs(options);
    }

    this.gqlSchemaHost.schema = schema;

    return {
      ...options,
      schema: await transformSchema(schema),
      typeDefs: undefined,
    };
  }

  private buildSchemaFromTypeDefs(options: GqlModuleOptions) {
    const { buildSubgraphSchema }: typeof import('@apollo/subgraph') =
      loadPackage('@apollo/subgraph', 'ApolloFederation', () =>
        require('@apollo/subgraph'),
      );

    return buildSubgraphSchema([
      {
        typeDefs: gql`
          ${options.typeDefs}
        `,
        resolvers: this.getResolvers(options.resolvers),
      },
    ]);
  }

  private async generateSchema(
    options: GqlModuleOptions,
  ): Promise<GraphQLSchema> {
    const {
      buildSubgraphSchema,
      printSubgraphSchema,
    }: typeof import('@apollo/subgraph') = loadPackage(
      '@apollo/subgraph',
      'ApolloFederation',
      () => require('@apollo/subgraph'),
    );

    const autoGeneratedSchema: GraphQLSchema =
      await this.gqlSchemaBuilder.buildFederatedSchema(
        options.autoSchemaFile,
        options,
        this.resolversExplorerService.getAllCtors(),
      );
    let executableSchema: GraphQLSchema = buildSubgraphSchema({
      typeDefs: gql(printSubgraphSchema(autoGeneratedSchema)),
      resolvers: this.getResolvers(options.resolvers),
    });

    executableSchema = this.overrideOrExtendResolvers(
      executableSchema,
      autoGeneratedSchema,
    );

    const schema = options.schema
      ? mergeSchemas({
          schemas: [options.schema, executableSchema],
        })
      : executableSchema;
    return schema;
  }

  private getResolvers(optionResolvers: any) {
    optionResolvers = Array.isArray(optionResolvers)
      ? optionResolvers
      : [optionResolvers];
    return this.extendResolvers([
      this.resolversExplorerService.explore(),
      ...this.scalarsExplorerService.explore(),
      ...optionResolvers,
    ]);
  }

  private extendResolvers(resolvers: any[]) {
    return resolvers.reduce((prev, curr) => extend(prev, curr), {});
  }

  private overrideOrExtendResolvers(
    executableSchema: GraphQLSchema,
    autoGeneratedSchema: GraphQLSchema,
  ): GraphQLSchema {
    // Note: "transformSchema" from "apollo-graphql" cannot be used since it removes directives added by the "buildFederatedSchema" function
    // Ref issue: https://github.com/apollographql/apollo-server/issues/4106
    return transformSchema(executableSchema, (type) => {
      if (isUnionType(type) && type.name !== '_Entity') {
        return this.overrideFederatedResolveType(type, autoGeneratedSchema);
      } else if (isInterfaceType(type)) {
        return this.overrideFederatedResolveType(type, autoGeneratedSchema);
      } else if (isEnumType(type)) {
        return autoGeneratedSchema.getType(type.name);
      } else if (isInputObjectType(type)) {
        const autoGeneratedInputType = autoGeneratedSchema.getType(
          type.name,
        ) as GraphQLInputObjectType;

        if (!autoGeneratedInputType) {
          return type;
        }
        const fields = type.getFields();
        forEach(fields, (value: GraphQLInputField, key: string) => {
          const field = autoGeneratedInputType.getFields()[key];
          if (!field) {
            return;
          }
          value.extensions = field.extensions;
          value.astNode = field.astNode;
        });
        type.extensions = autoGeneratedInputType.extensions;
        return type;
      } else if (isObjectType(type)) {
        const autoGeneratedObjectType = autoGeneratedSchema.getType(
          type.name,
        ) as GraphQLObjectType;

        if (!autoGeneratedObjectType) {
          return type;
        }
        const fields = type.getFields();
        forEach(
          fields,
          (value: GraphQLField<unknown, unknown>, key: string) => {
            const field = autoGeneratedObjectType.getFields()[key];
            if (!field) {
              return;
            }
            value.extensions = field.extensions;
            value.astNode = field.astNode;

            if (!value.resolve) {
              value.resolve = field.resolve;
            }
          },
        );
        type.extensions = autoGeneratedObjectType.extensions;
        return type;
      } else if (isScalarType(type) && type.name === 'DateTime') {
        const autoGeneratedScalar = autoGeneratedSchema.getType(
          type.name,
        ) as GraphQLScalarType;

        if (!autoGeneratedScalar) {
          return type;
        }
        type.parseLiteral = autoGeneratedScalar.parseLiteral;
        type.parseValue = autoGeneratedScalar.parseValue;
        return type;
      }
      return type;
    });
  }

  /**
   * Ensures that the resolveType method for unions and interfaces in the federated schema
   * is properly set from the one in the autoGeneratedSchema.
   */
  private overrideFederatedResolveType(
    typeInFederatedSchema: GraphQLUnionType | GraphQLInterfaceType,
    autoGeneratedSchema: GraphQLSchema,
  ): GraphQLUnionType | GraphQLInterfaceType {
    // Get the matching type from the auto generated schema
    const autoGeneratedType = autoGeneratedSchema.getType(
      typeInFederatedSchema.name,
    );
    // Bail if inconsistent with original schema
    if (
      !autoGeneratedType ||
      !(
        autoGeneratedType instanceof GraphQLUnionType ||
        autoGeneratedType instanceof GraphQLInterfaceType
      ) ||
      !autoGeneratedType.resolveType
    ) {
      return typeInFederatedSchema;
    }

    typeInFederatedSchema.resolveType = async (
      value: unknown,
      context: unknown,
      info: GraphQLResolveInfo,
      abstractType: GraphQLAbstractType,
    ) => {
      const resultFromAutogenSchema = await autoGeneratedType.resolveType(
        value,
        context,
        info,
        abstractType,
      );
      // If the result is not a GraphQLObjectType we're fine
      if (!resultFromAutogenSchema || isString(resultFromAutogenSchema)) {
        return resultFromAutogenSchema;
      }
      // We now have a GraphQLObjectType from the original union in the autogenerated schema.
      // But we can't return that without the additional federation property apollo adds to object
      // types (see node_modules/@apollo/federation/src/composition/types.ts:47).
      // Without that property, Apollo will ignore the returned type and the
      // union value will resolve to null. So we need to return the type with
      // the same name from the federated schema
      const resultFromFederatedSchema = info.schema.getType(
        resultFromAutogenSchema.name,
      );
      if (
        resultFromFederatedSchema &&
        resultFromFederatedSchema instanceof GraphQLObjectType
      ) {
        return resultFromFederatedSchema;
      }
      // If we couldn't find a match in the federated schema, return just the
      // name of the type and hope apollo works it out
      return resultFromAutogenSchema.name;
    };
    return typeInFederatedSchema;
  }
}
