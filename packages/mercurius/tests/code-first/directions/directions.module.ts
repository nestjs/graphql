import { Module } from '@nestjs/common';
import { DirectionsResolver } from './directions.resolver.js';

@Module({
  providers: [DirectionsResolver],
})
export class DirectionsModule {}
