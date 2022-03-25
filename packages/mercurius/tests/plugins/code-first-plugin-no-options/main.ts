import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import mercurius from 'mercurius';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule, new FastifyAdapter());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) =>
        new mercurius.ErrorWithProps('Validation error', { errors }, 200),
    }),
  );
  await app.listen(3010);
}
bootstrap();
