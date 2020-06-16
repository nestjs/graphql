import { GraphQLFieldConfigArgumentMap } from 'graphql';
import { BuildSchemaOptions } from '../../interfaces';
import { MethodArgsMetadata } from '../metadata';
import { InputTypeFactory } from './input-type.factory';
export declare class ArgsFactory {
  private readonly inputTypeFactory;
  constructor(inputTypeFactory: InputTypeFactory);
  create(
    args: MethodArgsMetadata[],
    options: BuildSchemaOptions,
  ): GraphQLFieldConfigArgumentMap;
  private inheritParentArgs;
}
