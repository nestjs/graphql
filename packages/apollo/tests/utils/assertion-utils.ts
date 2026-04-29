import { GraphQLResponse } from '@apollo/server';
import assert from 'assert';

const expectSingleResult = <TData = Record<string, unknown>>(
  response: GraphQLResponse<TData>,
) => {
  assert(response.body.kind === 'single');
  expect(response.body.singleResult.errors).toBeUndefined();
  return expect(response.body.singleResult.data);
};

export { expectSingleResult };
