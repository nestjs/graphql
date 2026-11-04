import { Injectable } from '@nestjs/common';
import {
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from 'graphql';
import {
  getUseFieldMiddleware,
  hasOwnUseFieldMiddleware,
} from '../../decorators/use-field-middleware.decorator.js';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { FieldMiddleware } from '../../interfaces/field-middleware.interface.js';
import { decorateFieldResolverWithMiddleware } from '../../utils/decorate-field-resolver.util.js';
import { PropertyMetadata } from '../metadata/index.js';
import { InterfaceMetadata } from '../metadata/interface.metadata.js';
import { cloneDefaultValue } from '../helpers/clone-default-value.helper.js';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { getInterfacesArray } from '../utils/get-interfaces-array.util.js';

@Injectable()
export class TypeFieldsAccessor {
  /**
   * The property each resolver returned by `createFieldResolver()` reads, so
   * that a type can rebuild the resolver of a field it inherits.
   */
  private readonly resolverProperties = new WeakMap<
    Function,
    PropertyMetadata
  >();

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
        args[item.name] = {
          type: item.type,
          defaultValue: item.defaultValue,
          description: item.description,
          deprecationReason: item.deprecationReason,
          astNode: item.astNode,
          extensions: item.extensions,
        };
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

  /**
   * Returns the fields that `host` inherits from its parent type. A member
   * that `host` decorates with `@UseFieldMiddleware()`, without declaring it
   * again with `@Field()`, gets a resolver built for `host`, so that the
   * middleware it adds runs as well.
   */
  extractInheritedFields(
    parent: GraphQLInterfaceType | GraphQLObjectType,
    host: Function,
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigMap<any, any> {
    const fieldsConfig = this.extractFromInterfaceOrObjectType(parent);

    for (const key in fieldsConfig) {
      const field = this.resolverProperties.get(fieldsConfig[key].resolve);
      if (field && hasOwnUseFieldMiddleware(host.prototype, field.name)) {
        fieldsConfig[key].resolve = this.createFieldResolver(
          field,
          options,
          host,
        );
      }
    }
    return fieldsConfig;
  }

  /**
   * Returns the properties declared by the interfaces that a type implements.
   * Each interface is visited once, after the interfaces it implements, so
   * that the declaration closest to the type comes last and wins. Interfaces
   * that the parent type already implements are skipped: their fields are
   * inherited with the parent's, which may declare them again.
   */
  getInterfaceProperties(
    metadata: ObjectTypeMetadata | InterfaceMetadata,
    parent?: GraphQLInterfaceType | GraphQLObjectType,
  ): PropertyMetadata[] {
    const inheritedInterfaces = new Set(
      (parent?.getInterfaces() ?? []).map(({ name }) => name),
    );
    return this.getRecursiveInterfaces(metadata)
      .filter(({ name }) => !inheritedInterfaces.has(name))
      .flatMap(({ properties }) => properties ?? []);
  }

  /**
   * Returns the resolver of a property field of the `host` type. It runs the
   * global middleware, the middleware passed through the `middleware` option
   * of `@Field()`, and the middleware applied with `@UseFieldMiddleware()`,
   * in this order.
   */
  createFieldResolver<
    TSource extends object = any,
    TContext = {},
    TArgs = { [argName: string]: any },
    TOutput = any,
  >(field: PropertyMetadata, options: BuildSchemaOptions, host: Function) {
    const rootFieldResolver = (root: object) => {
      const value = root[field.name];
      return typeof value === 'undefined'
        ? cloneDefaultValue(field.options.defaultValue)
        : value;
    };
    const middlewareFunctions = (options.fieldMiddleware || []).concat(
      field.middleware || [],
      this.getUseFieldMiddleware(field, host),
    );
    const rootResolveFnFactory = (root: TSource) => () =>
      rootFieldResolver(root);

    const resolve =
      middlewareFunctions.length === 0
        ? rootFieldResolver
        : decorateFieldResolverWithMiddleware<
            TSource,
            TContext,
            TArgs,
            TOutput
          >(rootResolveFnFactory, middlewareFunctions);

    this.resolverProperties.set(resolve, field);
    return resolve;
  }

  private getUseFieldMiddleware(
    field: PropertyMetadata,
    host: Function,
  ): FieldMiddleware[] {
    // The list of a subclass extends the list of the class it inherits the
    // member from (see `@UseFieldMiddleware()`).
    if (
      !field.target ||
      host === field.target ||
      host.prototype instanceof field.target
    ) {
      return getUseFieldMiddleware(host.prototype, field.name);
    }
    // The field is declared by an interface that `host` implements.
    return getUseFieldMiddleware(field.target.prototype, field.name).concat(
      getUseFieldMiddleware(host.prototype, field.name),
    );
  }

  private getRecursiveInterfaces(
    metadata: ObjectTypeMetadata | InterfaceMetadata,
    visited = new Set<InterfaceMetadata>(),
  ): InterfaceMetadata[] {
    const interfaces: InterfaceMetadata[] = [];
    for (const target of getInterfacesArray(metadata.interfaces)) {
      const item = TypeMetadataStorage.getInterfaceMetadataByTarget(target);
      if (!item || visited.has(item)) {
        continue;
      }
      visited.add(item);
      interfaces.push(...this.getRecursiveInterfaces(item, visited), item);
    }
    return interfaces;
  }
}
