export const printedSchemaSnapshot = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

"""
A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.
"""
scalar DateTime

"""The basic directions"""
enum Direction {
  Up
  Down
  Left
  Right
}

type Ingredient {
  id: ID!

  """ingredient name"""
  name: String @deprecated(reason: "is deprecated")
}

"""example interface"""
interface IRecipe {
  id: ID!
  title: String!
}

type Mutation {
  addRecipe(newRecipeData: NewRecipeInput!): Recipe!
  removeRecipe(id: String!): Boolean!
}

"""new recipe input"""
input NewRecipeInput {
  """recipe title"""
  title: String!
  description: String
  ingredients: [String!]!
}

type Query {
  move(direction: Direction!): Direction!

  """get recipe by id"""
  recipe(
    """recipe id"""
    id: String = "1"
  ): IRecipe!
  search: [SearchResultUnion!]! @deprecated(reason: "test")
  recipes(
    """number of items to skip"""
    skip: Int = 0
    take: Int = 25
  ): [Recipe!]!
}

"""recipe object type"""
type Recipe implements IRecipe {
  id: ID!
  title: String!
  description: String
  creationDate: DateTime!
  averageRating: Float!
  lastRate: Float
  tags: [String!]!
  ingredients: [Ingredient!]!
  rating: Float!
}

"""orphaned type"""
type SampleOrphanedType {
  id: ID!
  title: String!
  description: String
  creationDate: DateTime!
  averageRating: Float!
}

"""Search result description"""
union SearchResultUnion = Ingredient | Recipe

type Subscription {
  """subscription description"""
  recipeAdded: Recipe!
}
`;
