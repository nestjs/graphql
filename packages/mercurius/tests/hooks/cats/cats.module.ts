import { Module } from '@nestjs/common';
import { CatsResolver } from './cats.resolver.js';

@Module({
  providers: [CatsResolver],
})
export class CatsModule {}
