import { Global, INestApplication, Module } from '@nestjs/common';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@Resolver()
class AuditResolver {
  @Query(() => String)
  lastAuditEntry() {
    return 'internal';
  }
}

@Global()
@Module({ providers: [AuditResolver] })
class AuditModule {}

@Resolver()
class CatalogResolver {
  @Query(() => String)
  lastProduct() {
    return 'public';
  }
}

@Module({ providers: [CatalogResolver] })
class CatalogModule {}

describe('GraphQL - "include" and global modules', () => {
  let app: INestApplication;

  const createApp = async (include: Function[]) => {
    const module = await Test.createTestingModule({
      imports: [
        AuditModule,
        CatalogModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          include,
        }),
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  };

  const query = (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

  afterEach(async () => {
    await app.close();
  });

  it('should not expose the resolvers of a global module that is not included', async () => {
    await createApp([CatalogModule]);

    expect((await query('{ lastProduct }')).body).toEqual({
      data: { lastProduct: 'public' },
    });
    const { body } = await query('{ lastAuditEntry }');
    expect(body.data).toBeUndefined();
    expect(body.errors[0].message).toBe(
      'Cannot query field "lastAuditEntry" on type "Query".',
    );
  });

  it('should expose the resolvers of a global module that is included', async () => {
    await createApp([CatalogModule, AuditModule]);

    expect((await query('{ lastAuditEntry }')).body).toEqual({
      data: { lastAuditEntry: 'internal' },
    });
  });
});
