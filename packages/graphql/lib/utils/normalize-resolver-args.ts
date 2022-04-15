import { isType } from 'graphql';

export function normalizeResolverArgs(args: any[]) {
  const newArgs = [...args];
  // Reference resolver args don't have args argument
  const isReferenceResolver = newArgs.length === 3;
  // Resolve type args don't have args argument and the last argument is the parent object type
  const isResolveType =
    !isReferenceResolver && isType(newArgs[newArgs.length - 1]);

  // Add an undefined args argument
  if (isReferenceResolver || isResolveType) {
    newArgs.splice(1, 0, undefined);
  }
  return newArgs;
}
