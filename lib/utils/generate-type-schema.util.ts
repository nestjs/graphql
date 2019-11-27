import { buildSchema, BuildSchemaOptions } from 'type-graphql';
import { NestContainer } from '@nestjs/core';
import { DependenciesScanner } from '@nestjs/core/scanner';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Type } from '@nestjs/common';
import { GraphQLSchema } from 'graphql';

import { ScalarsExplorerService } from '../services/scalars-explorer.service';
import { lazyMetadataStorage } from '../storages/lazy-metadata.storage';
import { BaseExplorerService } from '../services/base-explorer.service';

export async function generateTypeSchema<T>(
  module: Type<T>,
  options: Omit<
    BuildSchemaOptions,
    'resolvers' | 'scalarsMap' | 'validate'
  > = {},
): Promise<GraphQLSchema> {
  const container = new NestContainer();
  const metadataScanner = new MetadataScanner();
  const dependenciesScanner = new DependenciesScanner(
    container,
    metadataScanner,
  );
  const baseExplorer = new BaseExplorerService();

  await dependenciesScanner.scan(module);

  const modulesContainer = container.getModules();
  const modules = baseExplorer.getModules(modulesContainer, []);

  const scalarsMap = baseExplorer.flatMap(modules, wrapper => {
    wrapper = { instance: wrapper.metatype?.prototype } as InstanceWrapper;
    return ScalarsExplorerService.prototype.filterExplicitScalar(wrapper);
  });
  const resolvers = baseExplorer.flatMap(modules, wrapper => wrapper.metatype);

  lazyMetadataStorage.load();

  return await buildSchema({
    validate: false,
    scalarsMap,
    resolvers,
    ...options,
  });
}
