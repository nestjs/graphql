import { Injectable } from '@nestjs/common';
import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { RootTypeFactory } from './root-type.factory.js';

@Injectable()
export class QueryTypeFactory {
  constructor(
    private readonly rootTypeFactory: RootTypeFactory,
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
  ) {}

  public create(
    typeRefs: Function[],
    options: BuildSchemaOptions,
  ): GraphQLObjectType {
    const objectTypeName = 'Query';
    const queriesMetadata = TypeMetadataStorage.getQueriesMetadata();

    const queryType = this.rootTypeFactory.create(
      typeRefs,
      queriesMetadata,
      objectTypeName,
      options,
    );
    if (queryType) {
      // Lets object types reference the root type, `@Field(() => 'Query')`,
      // e.g. to expose "query: Query!" on mutation payloads.
      this.typeDefinitionsStorage.addRootType(queryType);
    }
    return queryType;
  }
}
