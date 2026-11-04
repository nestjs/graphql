import { Injectable } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils.js';
import {
  GraphQLFieldConfigMap,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
} from 'graphql';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { InterfaceNotRegisteredError } from '../errors/interface-not-registered.error.js';
import { ReturnTypeCannotBeResolvedError } from '../errors/return-type-cannot-be-resolved.error.js';
import { InterfaceMetadata } from '../metadata/interface.metadata.js';
import { OrphanedReferenceRegistry } from '../services/orphaned-reference.registry.js';
import { TypeFieldsAccessor } from '../services/type-fields.accessor.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { getInterfacesArray } from '../utils/get-interfaces-array.util.js';
import { ArgsFactory } from './args.factory.js';
import { AstDefinitionNodeFactory } from './ast-definition-node.factory.js';
import { OutputTypeFactory } from './output-type.factory.js';
import { ResolveTypeFactory } from './resolve-type.factory.js';

export interface InterfaceTypeDefinition {
  target: Function;
  type: GraphQLInterfaceType;
  isAbstract: boolean;
  interfaces: Function[];
}

/**
 * Returns the most derived of the given classes that the value is an instance
 * of, so that an instance of a subclass is not resolved as its parent class.
 */
export function getMostDerivedType<T extends Function>(
  instance: unknown,
  types: readonly T[],
): T | undefined {
  return types
    .filter((type) => instance instanceof type)
    .reduce<T | undefined>(
      (mostDerived, type) =>
        !mostDerived || type.prototype instanceof mostDerived
          ? type
          : mostDerived,
      undefined,
    );
}

@Injectable()
export class InterfaceDefinitionFactory {
  constructor(
    private readonly resolveTypeFactory: ResolveTypeFactory,
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly outputTypeFactory: OutputTypeFactory,
    private readonly orphanedReferenceRegistry: OrphanedReferenceRegistry,
    private readonly typeFieldsAccessor: TypeFieldsAccessor,
    private readonly argsFactory: ArgsFactory,
    private readonly astDefinitionNodeFactory: AstDefinitionNodeFactory,
  ) {}

  public create(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): InterfaceTypeDefinition {
    const prototype = Object.getPrototypeOf(metadata.target);
    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getObjectTypeByTarget(prototype) ||
        this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };
    const resolveType = this.createResolveTypeFn(metadata);
    return {
      target: metadata.target,
      isAbstract: metadata.isAbstract || false,
      interfaces: getInterfacesArray(metadata.interfaces),
      type: new GraphQLInterfaceType({
        name: metadata.name,
        description: metadata.description,
        fields: this.generateFields(metadata, options),
        interfaces: this.generateInterfaces(metadata, getParentType),
        resolveType,
        /**
         * AST node has to be manually created in order to define directives
         * (more on this topic here: https://github.com/graphql/graphql-js/issues/1343)
         */
        astNode: this.astDefinitionNodeFactory.createInterfaceTypeNode(
          metadata.name,
          metadata.directives,
        ),
        extensions: metadata.extensions,
      }),
    };
  }

  private createResolveTypeFn(metadata: InterfaceMetadata) {
    const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
    const implementedTypes = objectTypesMetadata
      .filter((objectType) => {
        const interfaces = getInterfacesArray(objectType.interfaces);
        return interfaces.includes(metadata.target);
      })
      .map((objectType) => objectType.target);

    /**
     * The object types that implement the interface in the schema being
     * executed, which includes the subclasses that implement it through
     * their parent class only.
     */
    const possibleTypesBySchema = new WeakMap<GraphQLSchema, Function[]>();
    const getPossibleTypes = (info?: GraphQLResolveInfo) => {
      const interfaceType = info?.schema?.getType(metadata.name);
      if (!interfaceType) {
        return implementedTypes;
      }
      let possibleTypes = possibleTypesBySchema.get(info.schema);
      if (!possibleTypes) {
        const names = new Set(
          info.schema
            .getPossibleTypes(interfaceType as GraphQLInterfaceType)
            .map(({ name }) => name),
        );
        possibleTypes = objectTypesMetadata
          .filter(({ name }) => names.has(name))
          .map(({ target }) => target);
        possibleTypesBySchema.set(info.schema, possibleTypes);
      }
      return possibleTypes;
    };

    return metadata.resolveType
      ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
      : (instance: any, _context: unknown, info?: GraphQLResolveInfo) => {
          const target = getMostDerivedType(instance, getPossibleTypes(info));
          if (!target) {
            if (Reflect.has(instance, '__typename')) {
              return instance.__typename;
            }
            throw new ReturnTypeCannotBeResolvedError(metadata.name);
          }
          return this.typeDefinitionsStorage.getObjectTypeByTarget(target).type
            ?.name;
        };
  }

  private generateFields(
    metadata: InterfaceMetadata,
    options: BuildSchemaOptions,
  ): () => GraphQLFieldConfigMap<any, any> {
    const prototype = Object.getPrototypeOf(metadata.target);
    metadata.properties.forEach(({ typeFn }) =>
      this.orphanedReferenceRegistry.addToRegistryIfOrphaned(typeFn()),
    );
    const getParentType = () => {
      const parentTypeDefinition =
        this.typeDefinitionsStorage.getInterfaceByTarget(prototype);
      return parentTypeDefinition ? parentTypeDefinition.type : undefined;
    };

    return () => {
      let fields: GraphQLFieldConfigMap<any, any> = {};

      let properties = [];
      if (metadata.interfaces) {
        properties = this.typeFieldsAccessor.getInterfaceProperties(
          metadata,
          getParentType(),
        );
      }
      properties = properties.concat(metadata.properties);

      properties.forEach((field) => {
        const type = this.outputTypeFactory.create(
          field.name,
          field.typeFn(),
          options,
          field.options,
        );
        fields[field.schemaName] = {
          description: field.description,
          type,
          args: this.argsFactory.create(field.methodArgs, options),
          resolve: this.typeFieldsAccessor.createFieldResolver(
            field,
            options,
            metadata.target,
          ),
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

      if (!isUndefined(prototype.prototype)) {
        const parentClassRef = getParentType();
        if (parentClassRef) {
          const parentFields = this.typeFieldsAccessor.extractInheritedFields(
            parentClassRef,
            metadata.target,
            options,
          );
          fields = {
            ...parentFields,
            ...fields,
          };
        }
      }
      return fields;
    };
  }

  private generateInterfaces(
    metadata: InterfaceMetadata,
    getParentType: () => GraphQLObjectType | GraphQLInterfaceType,
  ) {
    const prototype = Object.getPrototypeOf(metadata.target);

    return () => {
      const interfaces: GraphQLInterfaceType[] = getInterfacesArray(
        metadata.interfaces,
      ).map((item: Function) => {
        const definition =
          this.typeDefinitionsStorage.getInterfaceByTarget(item);
        if (!definition) {
          throw new InterfaceNotRegisteredError(metadata.name, item);
        }
        return definition.type;
      });
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
}
