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
  });
});
