import { GraphQLAstExplorer } from '../lib/index.js';
import { gql } from 'graphql-tag';

describe('GraphQLAstExplorer', () => {
  describe('explore', () => {
    it('should mark non-nullable fields with arguments as required', async () => {
      const astExplorer = new GraphQLAstExplorer();

      const document = gql`
        type Cat {
          id: Int!
          name: String!
          weight(unit: String!): Int!
        }

        type Query {
          cat(id: ID!): Cat
        }
      `;

      const sourceFile = await astExplorer.explore(
        document,
        '/dev/null',
        'interface',
        {},
      );

      const catType = (sourceFile.getStructure().statements as any[]).find(
        (statement) => statement.name === 'Cat',
      );
      const weightField = catType.properties.find(
        (prop: any) => prop.name === 'weight',
      );
      expect(weightField.hasQuestionToken).toBe(false);
    });

    it('should keep root resolver fields required when skipResolverArgs is true', async () => {
      const astExplorer = new GraphQLAstExplorer();

      const document = gql`
        type User {
          id: ID!
          email: String!
        }

        type Mutation {
          signIn(login: String!, password: String!): User!
          signUp: User!
        }
      `;

      const sourceFile = await astExplorer.explore(
        document,
        '/dev/null',
        'interface',
        { skipResolverArgs: true },
      );

      const mutationType = (sourceFile.getStructure().statements as any[]).find(
        (statement) => statement.name === 'IMutation',
      );
      const signIn = mutationType.properties.find(
        (prop: any) => prop.name === 'signIn',
      );
      const signUp = mutationType.properties.find(
        (prop: any) => prop.name === 'signUp',
      );

      expect(signIn.hasQuestionToken).toBe(false);
      expect(signUp.hasQuestionToken).toBe(false);
    });

    it('should not emit descriptions as TSDoc comments by default', async () => {
      const astExplorer = new GraphQLAstExplorer();

      const document = gql`
        """
        A feline animal.
        """
        type Cat {
          """
          The name of the cat.
          """
          name: String!
        }
      `;

      const sourceFile = await astExplorer.explore(
        document,
        '/dev/null',
        'interface',
        {},
      );

      expect(sourceFile.getFullText()).not.toContain('A feline animal.');
      expect(sourceFile.getFullText()).not.toContain('The name of the cat.');
    });

    it('should emit descriptions as TSDoc comments when "emitDescriptions" is enabled', async () => {
      const astExplorer = new GraphQLAstExplorer();

      const document = gql`
        """
        A feline animal.
        """
        type Cat {
          """
          The name of the cat.
          """
          name: String!
        }

        """
        The available colors.
        """
        enum Color {
          """
          The color red.
          """
          RED
        }
      `;

      const sourceFile = await astExplorer.explore(
        document,
        '/dev/null',
        'interface',
        { emitDescriptions: true },
      );
      const text = sourceFile.getFullText();

      expect(text).toContain('/** A feline animal. */');
      expect(text).toContain('/** The name of the cat. */');
      expect(text).toContain('/** The available colors. */');
      expect(text).toContain('/** The color red. */');
    });
  });
});
