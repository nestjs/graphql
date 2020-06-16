import { GraphQLObjectType } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { RootTypeFactory } from './root-type.factory';
export declare class MutationTypeFactory {
  private readonly rootTypeFactory;
  constructor(rootTypeFactory: RootTypeFactory);
  create(typeRefs: Function[], options: BuildSchemaOptions): GraphQLObjectType;
}
