import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver.js';

@Module({
  imports: [],
  controllers: [],
  providers: [UserResolver],
})
export class ModuleBModule {}
