import { Injectable } from '@nestjs/common';
import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces/index.js';
import { TypeMetadataStorage } from '../storages/type-metadata.storage.js';
import { RootTypeFactory } from './root-type.factory.js';

@Injectable()
export class QueryTypeFactory {
  constructor(private readonly rootTypeFactory: RootTypeFactory) {}

  public create(
    typeRefs: Function[],
    options: BuildSchemaOptions,
  ): GraphQLObjectType {
    const objectTypeName = 'Query';
    const queriesMetadata = TypeMetadataStorage.getQueriesMetadata();

    return this.rootTypeFactory.create(
      typeRefs,
      queriesMetadata,
      objectTypeName,
      options,
    );
  }
}
