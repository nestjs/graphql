import { INestApplication } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { GraphQLObjectType } from 'graphql';
import request from 'supertest';
import { AppModule } from '../resolve-field-name/app.module.js';

/**
 * A renamed field resolver has to line up on both sides: the schema exposes the
 * name from the decorator options, and the resolver map is keyed by that same
 * name. When they diverge the field is published but never resolved.
 */
describe('ResolveField with a name given through options', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes the field under the configured name', () => {
    const { schema } = app.get(GraphQLSchemaHost);
    const authorType = schema.getType('Author') as GraphQLObjectType;
    const fields = authorType.getFields();

    expect(fields.displayName).toBeTruthy();
    expect(fields.resolveDisplayName).toBeUndefined();
  });

  it('resolves the field through the decorated method', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ author { id displayName } }' })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.author).toEqual({
      id: '1',
      displayName: 'author-1',
    });
  });
});
