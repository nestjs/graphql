import { registerEnumType } from '@nestjs/graphql';
<<<<<<< HEAD

=======
>>>>>>> 7624329 (chore(code-first): update imports to workspace paths)
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
