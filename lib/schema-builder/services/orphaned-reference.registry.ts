import { Injectable } from '@nestjs/common';
import { isFunction } from '@nestjs/common/utils/shared.utils';
import { GqlTypeReference } from '../../interfaces';

const BANNED_TYPES: Function[] = [String, Date, Number, Boolean];

@Injectable()
export class OrphanedReferenceRegistry {
  private readonly registry = new Set<Function>();

  addToRegistryIfOrphaned(typeRef: GqlTypeReference) {
    if (!isFunction(typeRef)) {
      return;
    }
    if (BANNED_TYPES.includes(typeRef as Function)) {
      return;
    }
    this.registry.add(typeRef as Function);
  }

  getAll(): Function[] {
    return [...this.registry.values()];
  }
}
