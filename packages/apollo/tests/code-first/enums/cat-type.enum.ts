import { registerEnumType } from '@nestjs/graphql';

export enum CatType {
  PersianCat = 'persian-cat',
  MaineCoon = 'maine-coon',
  Ragdoll = 'ragdoll',
}

registerEnumType(CatType, {
  name: 'CatType',
  description: 'Distinguish cats',
  mapToUppercase: true,
});
