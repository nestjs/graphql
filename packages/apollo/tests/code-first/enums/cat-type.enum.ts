import { registerEnumType } from '@nestjs/graphql';

export enum CatType {
  PersianCat = 'persian-cat',
  MaineCoon = 'maine-coon',
  Ragdoll = 'ragdoll',
  SomeNewAwesomeCat = 'some-new-awesome-cat',
  SomeWEIRDCat = 'some-weird-cat',
}

registerEnumType(CatType, {
  name: 'CatType',
  description: 'Distinguish cats',
  mapToUppercase: true,
});
