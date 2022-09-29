import { Test } from '@nestjs/testing';
import {
  GraphQLSchemaBuilderModule,
  Query,
  Mutation,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib';
import { RootTypeFactory } from '../../../lib/schema-builder/factories/root-type.factory';
import { LazyMetadataStorage } from '../../../lib/schema-builder/storages/lazy-metadata.storage';
import { MultipleFieldsWithSameNameError } from '../../../lib/schema-builder/errors/multiple-fields-with-same-name.error';
import { ResolverTypeMetadata } from '../../../lib/schema-builder/metadata';

describe('RootTypeFactory', () => {
  let rootTypeFactory: RootTypeFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    rootTypeFactory = module.get(RootTypeFactory);
  });

  afterEach(() => {
    TypeMetadataStorage.clear();
  });

  describe('generateFields', () => {
    describe.each([
      ['queries', Query, 'Query', TypeMetadataStorage.getQueriesMetadata],
      [
        'mutations',
        Mutation,
        'Mutation',
        TypeMetadataStorage.getMutationsMetadata,
      ],
    ])(
      'when duplicate %s are defined',
      (_, Decorator, objectTypeName, metadataFn) => {
        let metadata: ResolverTypeMetadata[];

        beforeEach(() => {
          LazyMetadataStorage.load([
            booleanResolverFactory(Decorator),
            booleanResolverFactory(Decorator),
          ]);
          TypeMetadataStorage.compile();

          metadata = metadataFn.apply(TypeMetadataStorage);
        });

        it('should throw an error with noDuplicateFields: true', () => {
          expect(() =>
            rootTypeFactory.generateFields(
              metadata,
              { noDuplicateFields: true },
              objectTypeName,
            ),
          ).toThrow(MultipleFieldsWithSameNameError);
        });

        it('should create GraphQL fields with noDuplicateFields: false', () => {
          const fields = rootTypeFactory.generateFields(
            metadata,
            { noDuplicateFields: false },
            objectTypeName,
          );
          expect(fields).toHaveProperty('bool');
        });

        it('should create GraphQL fields with noDuplicateFields undefined', () => {
          const fields = rootTypeFactory.generateFields(
            metadata,
            {},
            objectTypeName,
          );
          expect(fields).toHaveProperty('bool');
        });
      },
    );

    describe('when no duplicate queries are found', () => {
      beforeEach(() => {
        LazyMetadataStorage.load([
          booleanResolverFactory(Query),
          StringResolver,
        ]);
        TypeMetadataStorage.compile();
      });

      it('should correctly create GraphQL fields', () => {
        const queriesMetadata = TypeMetadataStorage.getQueriesMetadata();

        const fields = rootTypeFactory.generateFields(
          queriesMetadata,
          { noDuplicateFields: true },
          'Query',
        );

        expect(fields).toHaveProperty('bool');
        expect(fields).toHaveProperty('str');
      });
    });
  });
});

function booleanResolverFactory(Decorator: typeof Query | typeof Mutation) {
  @Resolver()
  class BooleanResolver {
    @Decorator(() => Boolean)
    bool() {
      return true;
    }
  }

  return BooleanResolver;
}

@Resolver()
class StringResolver {
  @Query(() => String)
  str() {
    return '';
  }
}
