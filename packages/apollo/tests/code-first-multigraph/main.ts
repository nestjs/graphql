import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { GatewayModule } from './gateway.module';

/**
 * This use case comes from the need for an application
 * to be designed in a way which would allow future context
 * separation from a deployment point of view.
 */
export async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);

  const gateway = await NestFactory.create(GatewayModule);
  await gateway.listen(3001);
}

bootstrap();
