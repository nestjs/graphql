export interface AliasDirectiveImport {
  name: string;
  as: string;
}

export type FederationVersion = 1 | 2;
export type FederationConfig = Federation2Config;

export interface Federation2Config {
  version: 2;
  /**
   * The imported directives
   * @default ['@composeDirective', '@extends', '@external', '@inaccessible', '@interfaceObject', '@key', '@override', '@provides', '@requires', '@shareable', '@tag']
   */
  directives?: (string | AliasDirectiveImport)[];
  /**
   * The import link
   * @default 'https://specs.apollo.dev/federation/v2.3'
   */
  importUrl?: string;
}

export interface SchemaFileConfig {
  /**
   * Federation version and its configuration,
   *
   * @default 1
   */
  federation?: FederationVersion | FederationConfig;

  /**
   * Path to the schema file.
   */
  path?: string;
}

export type AutoSchemaFileValue = boolean | string | SchemaFileConfig;
