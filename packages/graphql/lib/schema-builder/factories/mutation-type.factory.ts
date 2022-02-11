import { Injectable } from '@nestjs/common';
import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { RootTypeFactory } from './root-type.factory';

@Injectable()
export class MutationTypeFactory {
  constructor(private readonly rootTypeFactory: RootTypeFactory) {}

  public create(
    typeRefs: Function[],
    options: BuildSchemaOptions,
  ): GraphQLObjectType {
    const objectTypeName = 'Mutation';
    const mutationsMetadata = TypeMetadataStorage.getMutationsMetadata();

    return this.rootTypeFactory.create(
      typeRefs,
      mutationsMetadata,
      objectTypeName,
      options,
    );
  }
}
