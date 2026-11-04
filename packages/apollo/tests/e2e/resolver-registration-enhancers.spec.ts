import {
  CanActivate,
  INestApplication,
  Injectable,
  Scope,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApplicationModule } from '../code-first/app.module.js';
import { CatsModule } from '../code-first/cats/cats.module.js';
import { CatsResolver } from '../code-first/cats/cats.resolver.js';
import {
  GuardedCatsResolver,
  InstanceGuardedCatsResolver,
} from '../code-first/cats/guarded-cats.resolver.js';

@Injectable({ scope: Scope.REQUEST })
class RequestScopedDenyGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

describe('GraphQL - Enhancers of the resolver registration methods', () => {
  let app: INestApplication;

  const createApp = async (imports: any[], providers: any[] = []) => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule, ...imports],
      providers,
    }).compile();
    app = module.createNestApplication();
    return app;
  };

  const query = (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  describe('enhancers referenced by class', () => {
    it('should run them for a resolver registered with "useClass"', async () => {
      await (
        await createApp([CatsModule.register('useClass', GuardedCatsResolver)])
      ).init();

      const { body } = await query('{ getGuardedAnimalName }');
      expect(body.data).toBeNull();
      expect(body.errors[0].message).toBe('Forbidden resource');
    });

    it.each(['useFactory', 'useValue'] as const)(
      'should refuse to start with a resolver registered with "%s"',
      async (method) => {
        await createApp([CatsModule.register(method, GuardedCatsResolver)]);

        await expect(app.init()).rejects.toThrow(
          'The "GuardedCatsResolver.getGuardedAnimalName" GraphQL handler of the "GuardedCatsResolver" provider references "DenyGuard" by class, but Nest did not register this enhancer for the provider, so it would never run.',
        );
      },
    );

    it('should run enhancer instances for a resolver registered with "useFactory"', async () => {
      await (
        await createApp([
          CatsModule.register('useFactory', InstanceGuardedCatsResolver),
        ])
      ).init();

      const { body } = await query('{ getGuardedAnimalName }');
      expect(body.data).toBeNull();
      expect(body.errors[0].message).toBe('Forbidden resource');
    });
  });

  describe('request-scoped global guards', () => {
    const globalGuard = {
      provide: APP_GUARD,
      useClass: RequestScopedDenyGuard,
    };

    it.each([
      ['as a class', CatsResolver],
      ['with "useClass" under another token', 'CATS_RESOLVER'],
    ])('should run them for a resolver registered %s', async (_, token) => {
      await (
        await createApp(
          [CatsModule.register('useClass', CatsResolver, token)],
          [globalGuard],
        )
      ).init();

      const { body } = await query('{ getAnimalName }');
      expect(body.data).toBeNull();
      expect(body.errors[0].message).toBe('Forbidden resource');
    });

    it.each(['useFactory', 'useValue'] as const)(
      'should refuse to start with a resolver registered with "%s" under another token',
      async (method) => {
        await createApp(
          [CatsModule.register(method, CatsResolver, 'CATS_RESOLVER')],
          [globalGuard],
        );

        await expect(app.init()).rejects.toThrow(
          'The "CATS_RESOLVER" provider of the "CatsModule" module hosts GraphQL handlers but is not an entry provider, so the request or transient-scoped global enhancer "RequestScopedDenyGuard" would not run for them.',
        );
      },
    );
  });
});
