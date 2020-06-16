import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { ScalarsTypeMap } from '../interfaces';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { BaseExplorerService } from './base-explorer.service';
export declare class ScalarsExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly gqlOptions;
  constructor(modulesContainer: ModulesContainer, gqlOptions: GqlModuleOptions);
  explore(): unknown[];
  filterSchemaFirstScalar<T extends Record<string, Function | string> = any>(
    wrapper: InstanceWrapper<T>,
  ): {
    [x: string]: import('graphql').GraphQLScalarType;
  };
  getScalarsMap(): ScalarsTypeMap[];
  filterCodeFirstScalar<T extends Record<string, Function | string> = any>(
    wrapper: InstanceWrapper<T>,
  ): {
    type: any;
    scalar: import('graphql').GraphQLScalarType;
  };
}
