import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { GqlModuleOptions, SubscriptionOptions } from '..';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';
import { BaseExplorerService } from './base-explorer.service';
export declare class ResolversExplorerService extends BaseExplorerService {
  private readonly modulesContainer;
  private readonly metadataScanner;
  private readonly externalContextCreator;
  private readonly gqlOptions;
  private readonly gqlParamsFactory;
  private readonly injector;
  constructor(
    modulesContainer: ModulesContainer,
    metadataScanner: MetadataScanner,
    externalContextCreator: ExternalContextCreator,
    gqlOptions: GqlModuleOptions,
  );
  explore(): any;
  filterResolvers(
    wrapper: InstanceWrapper,
    moduleRef: Module,
  ): ResolverMetadata[];
  createContextCallback<T extends Record<string, any>>(
    instance: T,
    prototype: any,
    wrapper: InstanceWrapper,
    moduleRef: Module,
    resolver: ResolverMetadata,
    isRequestScoped: boolean,
    transform?: Function,
  ): (...args: any[]) => Promise<any>;
  createSubscriptionMetadata(
    createSubscribeContext: Function,
    subscriptionOptions: SubscriptionOptions,
    resolverMetadata: ResolverMetadata,
    instanceRef: Record<string, any>,
  ): {
    callback: {
      subscribe: any;
      resolve: any;
    };
    name: string;
    type: string;
    methodName: string;
  };
  getAllCtors(): Function[];
  private registerContextProvider;
}
