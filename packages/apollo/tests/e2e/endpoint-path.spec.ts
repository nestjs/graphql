import {
  INestApplication,
  Injectable,
  MiddlewareConsumer,
  Module,
  NestMiddleware,
  NestModule,
  RequestMethod,
  UnauthorizedException,
} from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NodeAdapter } from '@nestjs/platform-node';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../graphql/app.module.js';

@Injectable()
class ApiKeyMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    if (req.headers['x-api-key'] !== 'secret') {
      throw new UnauthorizedException();
    }
    next();
  }
}

@Module({ imports: [ApplicationModule] })
class ApiKeyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: 'graphql', method: RequestMethod.ALL });
  }
}

describe.each([
  ['Express', () => new ExpressAdapter()],
  ['Node', () => new NodeAdapter()],
])('GraphQL endpoint path (%s adapter)', (_, createAdapter) => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApiKeyModule],
    }).compile();

    app = module.createNestApplication(createAdapter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const query = (path: string) =>
    request(app.getHttpServer())
      .post(path)
      .send({ query: '{ getCats { id } }' });

  it('should run the middleware bound to the endpoint path', async () => {
    for (const path of ['/graphql', '/graphql/']) {
      await query(path).expect(401);
      await query(path)
        .set('x-api-key', 'secret')
        .expect(200, { data: { getCats: [{ id: 1 }] } });
    }
  });

  it('should not serve requests below the endpoint path', async () => {
    await query('/graphql/x').expect(404);
    await query('/graphql/a/b').expect(404);
    await request(app.getHttpServer())
      .get('/graphql/x')
      .query({ query: '{ getCats { id } }' })
      .set('apollo-require-preflight', 'true')
      .expect(404);
  });
});
