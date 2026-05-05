import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GraphiQLPlaygroundModule } from '../graphql/graphiql-playground.module';

describe('GraphiQL Playground', () => {
  let app: INestApplication;

  describe('when no landing page option is configured', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GraphiQLPlaygroundModule.withDefaults()],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it(`should render GraphiQL Playground by default`, async () => {
      const res = await request(app.getHttpServer())
        .get('/graphql')
        .set('Accept', 'text/html')
        .expect(200);
      expect(res.text).toContain('<title>GraphiQL</title>');
    });

    afterEach(async () => {
      await app.close();
    });
  });

  describe('when "playground" is true', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GraphiQLPlaygroundModule.withPlaygroundEnabled()],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it(`should render GraphiQL Playground as a migration alias`, async () => {
      const res = await request(app.getHttpServer())
        .get('/graphql')
        .set('Accept', 'text/html')
        .expect(200);
      expect(res.text).toContain('<title>GraphiQL</title>');
    });

    afterEach(async () => {
      await app.close();
    });
  });

  describe('when "graphiql" is true', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [GraphiQLPlaygroundModule.withEnabled()],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it(`should render GraphiQL Playground`, async () => {
      const res = await request(app.getHttpServer())
        .get('/graphql')
        .set('Accept', 'text/html')
        .expect(200);
      expect(res.text).toEqual(`
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
        url: '/graphql',
        subscriptionUrl: '/graphql',
        headers: {},
      })
      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          shouldPersistHeaders: true,
          isHeadersEditorEnabled: true,
          inputValueDeprecation: false,
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
`);
    });

    afterEach(async () => {
      await app.close();
    });
  });

  describe('when "graphiql" is an options object', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [
          GraphiQLPlaygroundModule.withEnabledAndCustomized({
            headers: {
              'x-custom-header': 'custom-value',
            },
            shouldPersistHeaders: false,
            isHeadersEditorEnabled: false,
          }),
        ],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it(`should render GraphiQL Playground`, async () => {
      const res = await request(app.getHttpServer())
        .get('/graphql')
        .set('Accept', 'text/html')
        .expect(200);
      expect(res.text).toEqual(`
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
        url: '/graphql',
        subscriptionUrl: '/graphql',
        headers: {"x-custom-header":"custom-value"},
      })
      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher,
          defaultEditorToolsVisibility: true,
          shouldPersistHeaders: false,
          isHeadersEditorEnabled: false,
          inputValueDeprecation: false,
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
`);
    });

    afterEach(async () => {
      await app.close();
    });
  });

  describe('when "graphiql" has inputValueDeprecation enabled', () => {
    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [
          GraphiQLPlaygroundModule.withEnabledAndCustomized({
            inputValueDeprecation: true,
          }),
        ],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it(`should render GraphiQL Playground with inputValueDeprecation enabled`, async () => {
      const res = await request(app.getHttpServer())
        .get('/graphql')
        .set('Accept', 'text/html')
        .expect(200);
      expect(res.text).toContain('inputValueDeprecation: true');
    });

    afterEach(async () => {
      await app.close();
    });
  });
});
