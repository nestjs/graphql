import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
export declare class BaseExplorerService {
  getModules(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[];
  includeWhitelisted(
    modulesContainer: Map<string, Module>,
    include: Function[],
  ): Module[];
  flatMap<T = ResolverMetadata>(
    modules: Module[],
    callback: (instance: InstanceWrapper, moduleRef: Module) => T | T[],
  ): T[];
  groupMetadata(resolvers: ResolverMetadata[]): any;
}
