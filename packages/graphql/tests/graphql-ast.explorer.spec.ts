import { GraphQLAstExplorer } from '../lib';
import { gql } from 'graphql-tag';

describe('GraphQLAstExplorer', () => {
  describe('explore', () => {
    it('should generate fields as optional when they contain arguments', () => {
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

      astExplorer
        .explore(document, '/dev/null', 'interface', {})
        .then((sourceFile) => {
          expect(
            sourceFile
              .getStructure()
              .statements[0].properties.find((prop) => prop.name === 'weight')!
              .hasQuestionToken,
          ).toBe(true);
        });
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
