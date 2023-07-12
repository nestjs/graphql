import { MetadataStorage } from 'class-validator';

export function getValidationMetadataByTarget(target: Function) {
  const classValidator: typeof import('class-validator') = require('class-validator');
  const metadataStorage: MetadataStorage = (classValidator as any)
    .getMetadataStorage
    ? (classValidator as any).getMetadataStorage()
    : classValidator.getFromContainer(classValidator.MetadataStorage);

  const targetMetadata = metadataStorage.getTargetValidationMetadatas(
    target,
    null!,
    false,
    false,
  );
  return targetMetadata;
}
