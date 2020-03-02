import { Injectable } from '@nestjs/common';
import { getIntrospectionQuery, graphql, GraphQLSchema } from 'graphql';
import { BuildSchemaOptions } from '../interfaces';
import { SchemaGenerationError } from './errors/schema-generation.error';
import { MutationTypeFactory } from './factories/mutation-type.factory';
import { OrphanedTypesFactory } from './factories/orphaned-types.factory';
import { QueryTypeFactory } from './factories/query-type.factory';
import { SubscriptionTypeFactory } from './factories/subscription-type.factory';
import { LazyMetadataStorage } from './storages/lazy-metadata.storage';
import { TypeMetadataStorage } from './storages/type-metadata.storage';
import { TypeDefinitionsGenerator } from './type-definitions.generator';

@Injectable()
export class GraphQLSchemaFactory {
  constructor(
    private readonly queryTypeFactory: QueryTypeFactory,
    private readonly mutationTypeFactory: MutationTypeFactory,
    private readonly subscriptionTypeFactory: SubscriptionTypeFactory,
    private readonly orphanedTypesFactory: OrphanedTypesFactory,
    private readonly typeDefinitionsGenerator: TypeDefinitionsGenerator,
  ) {}

  async create(
    resolvers: Function[],
    options: BuildSchemaOptions = {},
  ): Promise<GraphQLSchema> {
    TypeMetadataStorage.clear();
    LazyMetadataStorage.load(resolvers);
    TypeMetadataStorage.compile(options.orphanedTypes);

    this.typeDefinitionsGenerator.generate(options);

    const schema = new GraphQLSchema({
      mutation: this.mutationTypeFactory.create(resolvers, options),
      query: this.queryTypeFactory.create(resolvers, options),
      subscription: this.subscriptionTypeFactory.create(resolvers, options),
      types: this.orphanedTypesFactory.create(options.orphanedTypes),
      directives: options.directives,
    });

    if (!options.skipCheck) {
      const introspectionQuery = getIntrospectionQuery();
      const { errors } = await graphql(schema, introspectionQuery);
      if (errors) {
        throw new SchemaGenerationError(errors);
      }
    }
    return schema;
  }
}
