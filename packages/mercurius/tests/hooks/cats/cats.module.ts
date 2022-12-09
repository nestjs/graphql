import { Module } from '@nestjs/common';
import { CatsResolver } from './cats.resolver';

@Module({
  providers: [CatsResolver],
})
export class CatsModule {}
