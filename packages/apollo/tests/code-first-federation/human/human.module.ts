import { Module } from '@nestjs/common';
import { HumanResolver } from './human.resolver.js';

@Module({
  providers: [HumanResolver],
})
export class HumanModule {}
