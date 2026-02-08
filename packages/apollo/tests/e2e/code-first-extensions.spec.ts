import { INestApplication } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import * as assert from 'assert';
import { GraphQLObjectType } from 'graphql';
import { AppModule } from '../code-first-extensions/app.module';

describe('Code-first extensions', () => {
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

  it('Adds extensions to resolved field', async () => {
    const { schema } = app.get(GraphQLSchemaHost);
    const userObject = schema.getType('User') as GraphQLObjectType;
    assert(userObject, 'User type not found in schema');
    const statusField = userObject.getFields().status;
    assert(statusField, 'status field not found in User type');

    const extensions = statusField.extensions;

    expect(extensions.isPublic).toBe(true);
  });
});
