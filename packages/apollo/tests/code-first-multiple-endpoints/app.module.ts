import { Module } from '@nestjs/common';
import { PublicModule } from './public/public.module';
import { PrivateModule } from './private/private.module';

@Module({
  imports: [PublicModule, PrivateModule],
})
export class ApplicationModule {}
