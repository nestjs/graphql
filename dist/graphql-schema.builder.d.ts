import { GraphQLSchema } from 'graphql';
import { GqlModuleOptions } from './interfaces';
import { GraphQLSchemaFactory } from './schema-builder/graphql-schema.factory';
import { FileSystemHelper } from './schema-builder/helpers/file-system.helper';
import { ScalarsExplorerService } from './services';
export declare class GraphQLSchemaBuilder {
  private readonly scalarsExplorerService;
  private readonly gqlSchemaFactory;
  private readonly fileSystemHelper;
  constructor(
    scalarsExplorerService: ScalarsExplorerService,
    gqlSchemaFactory: GraphQLSchemaFactory,
    fileSystemHelper: FileSystemHelper,
  );
  build(
    autoSchemaFile: string | boolean,
    options: GqlModuleOptions,
    resolvers: Function[],
  ): Promise<any>;
  buildFederatedSchema(
    autoSchemaFile: string | boolean,
    options: GqlModuleOptions,
    resolvers: Function[],
  ): Promise<GraphQLSchema>;
  private buildSchema;
  private loadFederationDirectives;
}
