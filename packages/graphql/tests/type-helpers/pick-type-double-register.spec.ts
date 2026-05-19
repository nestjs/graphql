import { Field, InputType, TypeMetadataStorage } from '../../lib/index.js';
import { PickType } from '../../lib/type-helpers/index.js';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage.js';

@InputType()
class PickSourceInput {
  @Field()
  a: string;

  @Field()
  b: string;
}

class PickedInput extends PickType(PickSourceInput, ['a'] as const) {}

describe('PickType duplicate registration regression', () => {
  beforeAll(() => {
    LazyMetadataStorage.load([PickSourceInput, PickedInput]);
    TypeMetadataStorage.compile();
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should register the picked input type exactly once', () => {
    const inputs = TypeMetadataStorage.getInputTypesMetadata();
    const pickAbstract = Object.getPrototypeOf(PickedInput) as Function;
    const matches = inputs.filter((item) => item.target === pickAbstract);
    expect(matches).toHaveLength(1);
  });
});
