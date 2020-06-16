import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { GqlModuleOptions } from '../interfaces/gql-module-options.interface';
import { BaseExplorerService } from './base-explorer.service';
export declare class PluginsExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly gqlOptions;
  constructor(modulesContainer: ModulesContainer, gqlOptions: GqlModuleOptions);
  explore(): any[];
  filterPlugins<T = any>(wrapper: InstanceWrapper<T>): T;
}
