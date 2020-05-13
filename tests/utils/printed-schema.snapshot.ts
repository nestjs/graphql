export const printedSchemaSnapshot = `# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

"""example interface"""
interface IRecipe {
  id: ID!
  title: String!
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
  count(type: String, status: String): Float!
  rating: Float!
}

"""
A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.
"""
scalar DateTime

"""orphaned type"""
type SampleOrphanedType {
  id: ID!
  title: String!
  description: String
  creationDate: DateTime!
  averageRating: Float!
}

type Ingredient {
  id: ID!

  """ingredient name"""
  name: String @deprecated(reason: "is deprecated")
}

type Category {
  name: String!
  description: String!
  tags: [String!]!
}

type Query {
  move(direction: Direction!): Direction!

  """get recipe by id"""
  recipe(
    """recipe id"""
    id: String = "1"
  ): IRecipe!
  search: [SearchResultUnion!]! @deprecated(reason: "test")
  categories: [Category!]!
  recipes(
    """number of items to skip"""
    skip: Int = 0
    take: Int = 25
  ): [Recipe!]!
}

"""The basic directions"""
enum Direction {
  Up
  Down
  Left
  Right
}

"""Search result description"""
union SearchResultUnion = Ingredient | Recipe

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

type Subscription {
  """subscription description"""
  recipeAdded: Recipe!
}
`;
