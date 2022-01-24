import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { decorateFieldResolverWithMiddleware } from '../../utils/decorate-field-resolver.util';
import { PropertyMetadata } from '../metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry';
import { TypeFieldsAccessor } from '../services/type-fields.accessor';
import { TypeMetadataStorage } from '../storages';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { getInterfacesArray } from '../utils/get-interfaces-array.util';
import { ArgsFactory } from './args.factory';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory';
import { OutputTypeFactory } from './output-type.factory';

export interface ObjectTypeDefinition {
  target: Function;
  type: GraphQLObjectType;
  isAbstract: boolean;
  interfaces: Function[];
}

@Injectable()
export class ObjectTypeDefinitionFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly outputTypeFactory: OutputTypeFactory,
    private readonly typeFieldsAccessor: TypeFieldsAccessor,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
    private readonly orphanedReferenceRegistry: OrphanedReferenceRegistry,
    private readonly argsFactory: ArgsFactory,
  ) {}

  public create(
    metadata: ObjectTypeMetadata,
    options: BuildSchemaOptions,
  ): ObjectTypeDefinition {
    const prototype = Object.getPrototypeOf(metadata.target);
    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getObjectTypeByTarget(prototype) ||
        this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      interfaces: getInterfacesArray(metadata.interfaces),
      type: new GraphQLObjectType({
        name: metadata.name,
        description: metadata.description,
        /**
         * AST node has to be manually created in order to define directives
         * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
         */
        astNode: this.astDefinitionNodeFactory.createObjectTypeNode(
          metadata.name,
          metadata.directives,
        ),
        extensions: metadata.extensions,
        interfaces: this.generateInterfaces(metadata, getParentType),
        fields: this.generateFields(metadata, options, getParentType),
      }),
    };
  }

  private generateInterfaces(
    metadata: ObjectTypeMetadata,
    getParentType: () => GraphQLObjectType | GraphQLInterfaceType,
  ) {
    const prototype = Object.getPrototypeOf(metadata.target);

    return () => {
      const interfaces: GraphQLInterfaceType[] = getInterfacesArray(
        metadata.interfaces,
      ).map(
        (item: Function) =>
          this.typeDefinitionsStorage.getInterfaceByTarget(item).type,
      );
      if (!isUndefined(prototype)) {
        const parentClass = getParentType();
        if (!parentClass) {
          return interfaces;
        }
        const parentInterfaces = parentClass.getInterfaces?.() ?? [];
        return Array.from(new Set([...interfaces, ...parentInterfaces]));
      }
      return interfaces;
    };
  }

  private generateFields(
    metadata: ObjectTypeMetadata,
    options: BuildSchemaOptions,
    getParentType: () => GraphQLObjectType | GraphQLInterfaceType,
  ): () => GraphQLFieldConfigMap<any, any> {
    const prototype = Object.getPrototypeOf(metadata.target);
    metadata.properties.forEach(({ typeFn }) =>
      this.orphanedReferenceRegistry.addToRegistryIfOrphaned(typeFn()),
    );

    return () => {
      let fields: GraphQLFieldConfigMap<any, any> = {};

      let properties = [];
      if (metadata.interfaces) {
        const implementedInterfaces =
          TypeMetadataStorage.getInterfacesMetadata()
            .filter((it) =>
              getInterfacesArray(metadata.interfaces).includes(it.target),
            )
            .map((it) => it.properties);

        implementedInterfaces.forEach((fields) =>
          properties.push(...(fields || [])),
        );
      }
      properties = properties.concat(metadata.properties);

      properties.forEach((field: PropertyMetadata) => {
        const type = this.outputTypeFactory.create(
          field.name,
          field.typeFn(),
          options,
          field.options,
        );
        const resolve = this.createFieldResolver(field, options);

        fields[field.schemaName] = {
          type,
          args: this.argsFactory.create(field.methodArgs, options),
          resolve,
          description: field.description,
          deprecationReason: field.deprecationReason,
          /**
           * AST node has to be manually created in order to define directives
           * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
           */
          astNode: this.astDefinitionNodeFactory.createFieldNode(
            field.name,
            type,
            field.directives,
          ),
          extensions: {
            complexity: field.complexity,
            ...field.extensions,
          },
        };
      });
      if (!isUndefined(prototype)) {
        const parent = getParentType();
        if (parent) {
          const parentFields =
            this.typeFieldsAccessor.extractFromInterfaceOrObjectType(parent);
          fields = {
            ...parentFields,
            ...fields,
          };
        }
      }

      return fields;
    };
  }

  private createFieldResolver<
    TSource extends object = any,
    TContext = {},
    TArgs = { [argName: string]: any },
    TOutput = any,
  >(field: PropertyMetadata, options: BuildSchemaOptions) {
    const rootFieldResolver = (root: object) => {
      const value = root[field.name];
      return typeof value === 'undefined' ? field.options.defaultValue : value;
    };
    const middlewareFunctions = (options.fieldMiddleware || []).concat(
      field.middleware || [],
    );
    if (middlewareFunctions?.length === 0) {
      return rootFieldResolver;
    }
    const rootResolveFnFactory = (root: TSource) => () =>
      rootFieldResolver(root);

    return decorateFieldResolverWithMiddleware<
      TSource,
      TContext,
      TArgs,
      TOutput
    >(rootResolveFnFactory, middlewareFunctions);
  }
}
