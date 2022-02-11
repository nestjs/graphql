import { Injectable } from '@nestjs/common';
import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { TypeMetadataStorage } from '../storages/type-metadata.storage';
import { RootTypeFactory } from './root-type.factory';

@Injectable()
export class SubscriptionTypeFactory {
  constructor(private readonly rootTypeFactory: RootTypeFactory) {}

  public create(
    typeRefs: Function[],
    options: BuildSchemaOptions,
  ): GraphQLObjectType {
    const objectTypeName = 'Subscription';
    const subscriptionsMetadata =
      TypeMetadataStorage.getSubscriptionsMetadata();

    return this.rootTypeFactory.create(
      typeRefs,
      subscriptionsMetadata,
      objectTypeName,
      options,
    );
  }
}
