/**
 * @ref https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/GraphiQL.tsx#L97
 * @ref https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/GraphiQL.tsx#L192
 */
export interface GraphiQLOptions {
  url?: string;
  /**
   * Headers you can provide statically.
   *
   * If you enable the headers editor and the user provides
   * A header you set statically here, it will be overridden by their value.
   */
  headers?: Record<string, string>;
  /**
   * This prop toggles if the contents of the headers editor are persisted in
   * storage.
   * @default false
   */
  shouldPersistHeaders?: boolean;
  /**
   * Toggle if the headers editor should be shown inside the editor tools.
   * @default true
   */
  isHeadersEditorEnabled?: boolean;
}
