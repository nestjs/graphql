import { GraphQLFloat, GraphQLID, GraphQLInt } from 'graphql';

export * from './iso-date.scalar';
export * from './timestamp.scalar';

export const Int = GraphQLInt;
export const Float = GraphQLFloat;
export const ID = GraphQLID;
