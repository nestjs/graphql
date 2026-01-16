import { GraphiQLOptions } from './interfaces/graphiql-options.interface';

export class GraphiQLHTMLFactory {
  create(options: GraphiQLOptions): string {
    const shouldPersistHeaders = options.shouldPersistHeaders ?? true;
    const isHeadersEditorEnabled = options.isHeadersEditorEnabled ?? true;
    const inputValueDeprecation = options.inputValueDeprecation ?? false;
    const headers = options.headers ?? {};
    const url = options.url ?? '/graphql';
    const html = `
<!--
 *  Copyright (c) 2021 GraphQL Contributors
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
-->
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3.8.3/graphiql.min.css" />
  </head>

  <body>
    <div id="graphiql">Loading...</div>
    <script
      src="https://unpkg.com/graphiql@3.8.3/graphiql.min.js"
      type="application/javascript"
    ></script>
    <script>
      const fetcher = GraphiQL.createFetcher({
        url: '${url}',
        subscriptionUrl: '${url}',
        headers: ${JSON.stringify(headers)},
      })
      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          shouldPersistHeaders: ${shouldPersistHeaders ? 'true' : 'false'},
          isHeadersEditorEnabled: ${isHeadersEditorEnabled ? 'true' : 'false'},
          inputValueDeprecation: ${inputValueDeprecation ? 'true' : 'false'},
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
`;
    return html;
  }
}
