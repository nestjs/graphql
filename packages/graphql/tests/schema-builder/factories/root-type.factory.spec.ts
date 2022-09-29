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
import { GraphQLNonNull } from 'graphql';

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
    describe('when duplicate queries are defined', () => {
      beforeEach(() => {
        LazyMetadataStorage.load([
          booleanResolverFactory(Query),
          booleanResolverFactory(Query),
        ]);
        TypeMetadataStorage.compile();
      });

      it('should throw an error', () => {
        const queriesMetadata = TypeMetadataStorage.getQueriesMetadata();

        expect(() =>
          rootTypeFactory.generateFields(queriesMetadata, {}, 'Query'),
        ).toThrow(MultipleFieldsWithSameNameError);
      });
    });

    describe('when duplicate mutations are defined', () => {
      beforeEach(() => {
        LazyMetadataStorage.load([
          booleanResolverFactory(Mutation),
          booleanResolverFactory(Mutation),
        ]);
        TypeMetadataStorage.compile();
      });

      it('should throw an error', () => {
        const mutationsMetadata = TypeMetadataStorage.getMutationsMetadata();

        expect(() =>
          rootTypeFactory.generateFields(mutationsMetadata, {}, 'Mutation'),
        ).toThrow(MultipleFieldsWithSameNameError);
      });
    });

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
          {},
          'Query',
        );

        expect(fields).toMatchObject({
          bool: {
            type: expect.any(GraphQLNonNull),
            args: {},
            resolve: undefined,
          },
          str: {
            type: expect.any(GraphQLNonNull),
            args: {},
            resolve: undefined,
          },
        });
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
