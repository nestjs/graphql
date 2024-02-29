import { Module } from '@nestjs/common';
import { HumanResolver } from './human.resolver';

@Module({
  providers: [HumanResolver],
})
export class HumanModule {}
