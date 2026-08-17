import { Type } from '@nestjs/common';
import { ArgsType, Field, TypeMetadataStorage } from '../../lib/index.js';
import { LazyMetadataStorage } from '../../lib/schema-builder/storages/lazy-metadata.storage.js';

class FeatureModule {}

describe('@ArgsType decorator', () => {
  afterEach(() => {
    TypeMetadataStorage.clear();
  });

  function getMetadata(target: Type<unknown>) {
    LazyMetadataStorage.load([target]);
    TypeMetadataStorage.compile();

    return TypeMetadataStorage.getArgumentsMetadataByTarget(target);
  }

  it('should fall back to the class name when called without arguments', () => {
    @ArgsType()
    class TestArgs {
      @Field(() => String)
      query!: string;
    }

    const metadata = getMetadata(TestArgs);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('TestArgs');
  });

  it('should fall back to the class name when called with options only', () => {
    @ArgsType({ registerIn: () => FeatureModule })
    class TestArgs {
      @Field(() => String)
      query!: string;
    }

    const metadata = getMetadata(TestArgs);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('TestArgs');
    expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
  });

  it('should use the explicit name when called with a name only', () => {
    @ArgsType('CustomArgs')
    class TestArgs {
      @Field(() => String)
      query!: string;
    }

    const metadata = getMetadata(TestArgs);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('CustomArgs');
    expect(metadata!.registerIn).toBeUndefined();
  });

  it('should use the explicit name when called with a name and options', () => {
    @ArgsType('CustomArgs', { registerIn: () => FeatureModule })
    class TestArgs {
      @Field(() => String)
      query!: string;
    }

    const metadata = getMetadata(TestArgs);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('CustomArgs');
    expect((metadata!.registerIn as () => Function)()).toBe(FeatureModule);
  });
});
