import { GraphQLCompositeType, GraphQLField } from 'graphql';

export type ComplexityEstimatorArgs = {
  type: GraphQLCompositeType;
  field: GraphQLField<any, any>;
  args: { [key: string]: any };
  childComplexity: number;
};

export type ComplexityEstimator = (
  options: ComplexityEstimatorArgs,
) => number | void;
export type Complexity = ComplexityEstimator | number;
