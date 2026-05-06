import { Module } from '@nestjs/common';
import { InitializeOnPreviewAllowlist } from '@nestjs/core/inspector/index.js';
import { schemaBuilderFactories } from './factories/factories.js';
import { GraphQLSchemaFactory } from './graphql-schema.factory.js';
import { FileSystemHelper } from './helpers/file-system.helper.js';
import { OrphanedReferenceRegistry } from './services/orphaned-reference.registry.js';
import { TypeFieldsAccessor } from './services/type-fields.accessor.js';
import { TypeMapperService } from './services/type-mapper.service.js';
import { TypeDefinitionsStorage } from './storages/type-definitions.storage.js';
import { TypeDefinitionsGenerator } from './type-definitions.generator.js';

@Module({
  providers: [
    ...schemaBuilderFactories,
    GraphQLSchemaFactory,
    TypeDefinitionsGenerator,
    FileSystemHelper,
    TypeDefinitionsStorage,
    TypeMapperService,
    TypeFieldsAccessor,
    OrphanedReferenceRegistry,
  ],
  exports: [GraphQLSchemaFactory, FileSystemHelper],
})
export class GraphQLSchemaBuilderModule {}

InitializeOnPreviewAllowlist.add(GraphQLSchemaBuilderModule);
