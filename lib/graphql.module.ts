import { Inject, Module } from '@nestjs/common';
import {
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
  Type,
} from '@nestjs/common/interfaces';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { graphiqlExpress, graphqlExpress } from 'apollo-server-express';
import {
  GraphQLParseOptions,
  IConnectors,
  IDirectiveResolvers,
  ILogger,
  IResolverValidationOptions,
  IResolvers,
  ITypeDefinitions,
  SchemaDirectiveVisitor,
} from 'graphql-tools';
import { GRAPHQL_MODULE_OPTIONS } from './graphql.constants';
import { GraphQLFactory } from './graphql.factory';
import { DelegatesExplorerService } from './services/delegates-explorer.service';
import { ResolversExplorerService } from './services/resolvers-explorer.service';
import { ScalarsExplorerService } from './services/scalars-explorer.service';
import { extend } from './utils/extend.util';
import { mergeDefaults } from './utils/merge-defaults.util';

export interface GraphQLModuleOptions {
  path?: string;
  modules?: Array<Type<any> | DynamicModule>;
  rootValueResolver?: (req) => any;
  typePaths?: string[];
  typeDefs?: ITypeDefinitions;
  resolvers?: IResolvers<any, any> | Array<IResolvers<any, any>>;
  connectors?: IConnectors<any>;
  logger?: ILogger;
  allowUndefinedInResolve?: boolean;
  resolverValidationOptions?: IResolverValidationOptions;
  directiveResolvers?: IDirectiveResolvers<any, any>;
  schemaDirectives?: {
    [name: string]: typeof SchemaDirectiveVisitor;
  };
  parseOptions?: GraphQLParseOptions;
  formatError?: Function;
  contextResolver?: (req) => any;
  logFunction?: Function;
  formatParams?: Function;
  validationRules?: Array<(context: any) => any>;
  formatResponse?: Function;
  fieldResolver?: any;
  debug?: boolean;
  tracing?: boolean;
  cacheControl?: any;
  graphiQl?: {
    endpointURL: string;
    path?: string;
    subscriptionsEndpoint?: string;
    query?: string;
    variables?: Object;
    operationName?: string;
    result?: Object;
    passHeader?: string;
    editorTheme?: string;
    websocketConnectionParams?: Object;
  };
}

@Module({
  providers: [
    GraphQLFactory,
    MetadataScanner,
    ResolversExplorerService,
    DelegatesExplorerService,
    ScalarsExplorerService,
  ],
  exports: [GraphQLFactory, ResolversExplorerService],
})
export class GraphQLModule implements NestModule {
  constructor(
    @Inject(GRAPHQL_MODULE_OPTIONS)
    private readonly options: GraphQLModuleOptions,
    private readonly graphQLFactory: GraphQLFactory,
  ) {}

  static forRoot(options: GraphQLModuleOptions = {}): DynamicModule {
    return {
      module: GraphQLModule,
      providers: [
        {
          provide: GRAPHQL_MODULE_OPTIONS,
          useValue: mergeDefaults(options),
        },
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    const typeDefs = this.graphQLFactory.mergeTypesByPaths(
      ...(this.options.typePaths || []),
    );

    const schema = this.graphQLFactory.createSchema({
      typeDefs: extend(typeDefs, this.options.typeDefs),
      resolvers: this.options.resolvers,
      schemaDirectives: this.options.schemaDirectives,
      connectors: this.options.connectors,
      logger: this.options.logger,
      allowUndefinedInResolve: this.options.allowUndefinedInResolve,
      resolverValidationOptions: this.options.resolverValidationOptions,
      directiveResolvers: this.options.directiveResolvers,
      parseOptions: this.options.parseOptions,
    });

    if (this.options.graphiQl) {
      consumer
        .apply(graphiqlExpress(this.options.graphiQl))
        .forRoutes(this.options.graphiQl.path);
    }
    consumer
      .apply(
        graphqlExpress(req => ({
          schema,
          rootValue: this.options.rootValueResolver(req),
          context: this.options.contextResolver(req),
          parseOptions: this.options.parseOptions,
          formatError: this.options.formatError,
          logFunction: this.options.logFunction as any,
          formatParams: this.options.formatParams,
          validationRules: this.options.validationRules,
          formatResponse: this.options.formatResponse,
          fieldResolver: this.options.fieldResolver,
          debug: this.options.debug,
          tracing: this.options.tracing,
          cacheControl: this.options.cacheControl,
        })),
      )
      .forRoutes(this.options.path);
  }
}
