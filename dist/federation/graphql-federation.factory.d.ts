import { GraphQLSchemaBuilder } from '../graphql-schema.builder';
import { GqlModuleOptions } from '../interfaces';
import {
  PluginsExplorerService,
  ResolversExplorerService,
  ScalarsExplorerService,
} from '../services';
export declare class GraphQLFederationFactory {
  private readonly resolversExplorerService;
  private readonly scalarsExplorerService;
  private readonly pluginsExplorerService;
  private readonly gqlSchemaBuilder;
  constructor(
    resolversExplorerService: ResolversExplorerService,
    scalarsExplorerService: ScalarsExplorerService,
    pluginsExplorerService: PluginsExplorerService,
    gqlSchemaBuilder: GraphQLSchemaBuilder,
  );
  mergeOptions(options?: GqlModuleOptions): Promise<GqlModuleOptions>;
  private buildSchemaFromTypeDefs;
  private generateSchema;
  private getResolvers;
  private extendResolvers;
  private overrideOrExtendResolvers;
  private overrideFederatedResolveType;
}
