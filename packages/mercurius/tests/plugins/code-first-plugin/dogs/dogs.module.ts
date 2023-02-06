import { Module } from '@nestjs/common';
import { DogsResolver } from './dogs.resolver';

@Module({
  providers: [DogsResolver],
})
export class DogsModule {}
