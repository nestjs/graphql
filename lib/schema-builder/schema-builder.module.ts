/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */

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
