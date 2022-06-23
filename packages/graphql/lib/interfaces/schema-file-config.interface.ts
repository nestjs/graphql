export interface AliasDirectiveImport {
  name: string;
  as: string;
}

export interface Federation2Config {
  /**
   * The imported directives
   * @default ['@key', '@shareable', '@external', '@override', '@requires']
   */
  directives?: (string | AliasDirectiveImport)[];
  /**
   * The import link
   * @default 'https://specs.apollo.dev/federation/v2.0'
   */
  importUrl?: string;
}

export type UseFed2Value = boolean | Federation2Config;

export interface SchemaFileConfig {
  /**
   * If enabled, it will use federation 2 schema
   * 
   * **Note:** You need to have installed @apollo/subgraph@^2.0.0 and enable `autoSchemaFile`
   * 
   * This will add to your schema:
   * ```graphql
      extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@override", "@requires"])
   * ```
  */
  useFed2?: UseFed2Value;

  /**
   * The path to the schema file
   */
  path?: string;
}

export type AutoSchemaFileValue = boolean | string | SchemaFileConfig;
