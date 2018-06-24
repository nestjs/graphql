import {
  DynamicModule,
  MiddlewareConsumer,
  NestModule,
  Type,
} from '@nestjs/common/interfaces';
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
import { GraphQLFactory } from './graphql.factory';
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
export declare class GraphQLModule implements NestModule {
  private readonly options;
  private readonly graphQLFactory;
  constructor(options: GraphQLModuleOptions, graphQLFactory: GraphQLFactory);
  static forRoot(options?: GraphQLModuleOptions): DynamicModule;
  configure(consumer: MiddlewareConsumer): void;
}
