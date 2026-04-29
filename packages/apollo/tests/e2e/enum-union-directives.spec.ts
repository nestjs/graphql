import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginInlineTraceDisabled } from '@apollo/server/plugin/disabled';
import { INestApplication, Module } from '@nestjs/common';
import {
  Directive,
  Field,
  GraphQLModule,
  ID,
  ObjectType,
  Query,
  Resolver,
  createUnionType,
  registerEnumType,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import assert from 'assert';
import { gql } from 'graphql-tag';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '../../lib';

enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

registerEnumType(Visibility, {
  name: 'Visibility',
  description: 'Visibility of a resource',
  directives: ['@tag(name: "visibility")'],
  valuesMap: {
    PUBLIC: { directives: ['@tag(name: "public")'] },
  },
});

@ObjectType()
@Directive('@key(fields: "id")')
class Article {
  @Field(() => ID)
  id: string;
}

@ObjectType()
@Directive('@key(fields: "id")')
class Video {
  @Field(() => ID)
  id: string;
}

const Media = createUnionType({
  name: 'Media',
  types: () => [Article, Video] as const,
  directives: ['@tag(name: "media")'],
});

@Resolver()
class DirectivesResolver {
  @Query(() => Visibility)
  visibility(): Visibility {
    return Visibility.PUBLIC;
  }

  @Query(() => Media)
  latest(): typeof Media {
    return { id: '1' } as unknown as typeof Media;
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: true,
      buildSchemaOptions: {
        orphanedTypes: [Article, Video],
      },
      plugins: [ApolloServerPluginInlineTraceDisabled()],
    }),
  ],
  providers: [DirectivesResolver],
})
class DirectivesAppModule {}

describe('Code-first - directives on enums and unions (e2e)', () => {
  let app: INestApplication;
  let apolloClient: ApolloServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DirectivesAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const graphqlModule =
      app.get<GraphQLModule<ApolloFederationDriver>>(GraphQLModule);
    apolloClient = graphqlModule.graphQlAdapter?.instance;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should emit enum, enum-value and union directives in the subgraph SDL', async () => {
    const response = await apolloClient.executeOperation({
      query: gql`
        {
          _service {
            sdl
          }
        }
      `,
    });
    assert(response.body.kind === 'single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const sdl = (
      response.body.singleResult.data as { _service: { sdl: string } }
    )._service.sdl;

    expect(sdl).toMatch(/enum Visibility[^{]*@tag\(name: "visibility"\)/);
    expect(sdl).toMatch(/PUBLIC @tag\(name: "public"\)/);
    expect(sdl).not.toMatch(/PRIVATE[^\n]*@tag/);
    expect(sdl).toMatch(/union Media[^=]*@tag\(name: "media"\)/);
  });
});
