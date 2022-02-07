import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import mercurius from 'mercurius';
import { ApplicationModule } from '../code-first/app.module';
import { CatsModule } from '../code-first/cats/cats.module';

describe('GraphQL - Resolver registration methods', () => {
    let app: INestApplication;
  
    describe('useClass', () => {
        beforeEach(async () => {
            const module = await Test.createTestingModule({
                imports: [ApplicationModule, CatsModule.register('useClass')],
            }).compile();
      
            app = module.createNestApplication(new FastifyAdapter());
            await app.init();
            await app.getHttpAdapter().getInstance().ready();
        });

        it('should return the cats result', async () => {
            const fastifyInstance = app.getHttpAdapter().getInstance();
            const response = await fastifyInstance.graphql(
                'query {\n  getAnimalName \n}\n',
            );

            expect(response.data).toEqual({ getAnimalName: 'cat' });
        });

        afterEach(async () => {
            await app.close();
        });
    });
  
    describe('useValue', () => {
        beforeEach(async () => {
            const module = await Test.createTestingModule({
                imports: [ApplicationModule, CatsModule.register('useValue')],
            }).compile();
      
            app = module.createNestApplication(new FastifyAdapter());
            await app.init();
            await app.getHttpAdapter().getInstance().ready();
        });

        it('should return the cats result', async () => {
            const fastifyInstance = app.getHttpAdapter().getInstance();
            const response = await fastifyInstance.graphql(
                'query {\n  getAnimalName \n}\n',
            );

            expect(response.data).toEqual({ getAnimalName: 'cat' });
        });

        afterEach(async () => {
            await app.close();
        });
    });
  
    describe('useFactory', () => {
        beforeEach(async () => {
            const module = await Test.createTestingModule({
                imports: [ApplicationModule, CatsModule.register('useFactory')],
            }).compile();
      
            app = module.createNestApplication(new FastifyAdapter());
            await app.init();
            await app.getHttpAdapter().getInstance().ready();
        });

        it('should return the cats result', async () => {
            const fastifyInstance = app.getHttpAdapter().getInstance();
            const response = await fastifyInstance.graphql(
                'query {\n  getAnimalName \n}\n',
            );

            expect(response.data).toEqual({ getAnimalName: 'cat' });
        });

        afterEach(async () => {
            await app.close();
        });
    });
});
