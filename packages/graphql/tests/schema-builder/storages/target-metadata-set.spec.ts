import {
  ArgsType,
  Field,
  ID,
  ObjectType,
  TypeMetadataStorage,
} from '../../../lib';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';

@ObjectType()
class TargetSetObjectCheck {
  @Field(() => ID)
  id: string;
}

@ArgsType()
class TargetSetArgsCheck {
  @Field()
  q: string;
}

describe('TargetMetadataCollection idempotent set', () => {
  beforeAll(() => {
    LazyMetadataStorage.load([TargetSetObjectCheck, TargetSetArgsCheck]);
    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should list each @ObjectType once, even though the decorator runs eagerly and as a lazy callback', () => {
    const objectTypes = TypeMetadataStorage.getObjectTypesMetadata();
    const matches = objectTypes.filter(
      (item) => item.target === TargetSetObjectCheck,
    );
    expect(matches).toHaveLength(1);
  });

  it('should list each @ArgsType once', () => {
    const argTypes = TypeMetadataStorage.getArgumentsMetadata();
    const matches = argTypes.filter(
      (item) => item.target === TargetSetArgsCheck,
    );
    expect(matches).toHaveLength(1);
  });
});
