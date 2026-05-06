import { Module } from '@nestjs/common';
import { DogsResolver } from './dogs.resolver.js';

@Module({
  providers: [DogsResolver],
})
export class DogsModule {}
