import { Test } from '@nestjs/testing';
import {
  Field,
  InputType,
  GraphQLSchemaBuilderModule,
  TypeMetadataStorage,
} from '../../../lib';
import { TypeDefinitionsGenerator } from '../../../lib/schema-builder/type-definitions.generator';
import { TypeDefinitionsStorage } from '../../../lib/schema-builder/storages/type-definitions.storage';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';

@InputType('DeprecationInput')
class DeprecationInput {
  @Field(() => String, { description: 'regular' })
  regular!: string;

  @Field(() => String, {
    description: 'deprecated',
    deprecationReason: 'use something else',
  })
  oldField!: string;
}

describe('InputTypeDefinitionFactory (deprecation)', () => {
  let generator: TypeDefinitionsGenerator;
  let storage: TypeDefinitionsStorage;

  beforeAll(async () => {
    // Register metadata for the input type
    LazyMetadataStorage.load([DeprecationInput]);
    TypeMetadataStorage.compile();

    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    generator = moduleRef.get(TypeDefinitionsGenerator);
    storage = moduleRef.get(TypeDefinitionsStorage);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should mark input fields as deprecated if value is set', () => {
    // Generate type definitions (inputs included)
    generator.generate({} as any);

    const inputType: any = storage.getInputTypeAndExtract(DeprecationInput);
    expect(inputType).toBeDefined();

    const fields = inputType.getFields();
    expect(fields.regular.deprecationReason).toBeUndefined();
    expect(fields.oldField.deprecationReason).toBe('use something else');
  });
});
