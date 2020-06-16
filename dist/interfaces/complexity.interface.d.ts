import { GraphQLCompositeType, GraphQLField } from 'graphql';
export declare type ComplexityEstimatorArgs = {
  type: GraphQLCompositeType;
  field: GraphQLField<any, any>;
  args: {
    [key: string]: any;
  };
  childComplexity: number;
};
export declare type ComplexityEstimator = (
  options: ComplexityEstimatorArgs,
) => number | void;
export declare type Complexity = ComplexityEstimator | number;
