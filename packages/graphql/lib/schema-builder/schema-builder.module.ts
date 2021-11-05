import { Module } from '@nestjs/common';
import { schemaBuilderFactories } from './factories/factories';
import { GraphQLSchemaFactory } from './graphql-schema.factory';
import { FileSystemHelper } from './helpers/file-system.helper';
import { OrphanedReferenceRegistry } from './services/orphaned-reference.registry';
import { TypeFieldsAccessor } from './services/type-fields.accessor';
import { TypeMapperSevice } from './services/type-mapper.service';
import { TypeDefinitionsStorage } from './storages/type-definitions.storage';
import { TypeDefinitionsGenerator } from './type-definitions.generator';

@Module({
  providers: [
    ...schemaBuilderFactories,
    GraphQLSchemaFactory,
    TypeDefinitionsGenerator,
    FileSystemHelper,
    TypeDefinitionsStorage,
    TypeMapperSevice,
    TypeFieldsAccessor,
    OrphanedReferenceRegistry,
  ],
  exports: [GraphQLSchemaFactory, FileSystemHelper],
})
export class GraphQLSchemaBuilderModule {}
