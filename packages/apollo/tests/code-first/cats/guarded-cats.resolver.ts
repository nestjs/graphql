import { CanActivate, Injectable, UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

@Injectable()
export class DenyGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

@Resolver()
export class GuardedCatsResolver {
  @UseGuards(DenyGuard)
  @Query((returns) => String)
  getGuardedAnimalName(): string {
    return 'guarded cat';
  }
}

@Resolver()
export class InstanceGuardedCatsResolver {
  @UseGuards(new DenyGuard())
  @Query((returns) => String)
  getGuardedAnimalName(): string {
    return 'guarded cat';
  }
}
