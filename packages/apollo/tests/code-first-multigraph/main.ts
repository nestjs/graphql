import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { GatewayModule } from './gateway.module';

export async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);

  const gateway = await NestFactory.create(GatewayModule);
  await gateway.listen(3001);
}

bootstrap();
