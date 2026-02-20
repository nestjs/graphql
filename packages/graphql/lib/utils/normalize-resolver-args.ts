import { isType } from 'graphql';

export function normalizeResolverArgs(args: any[]) {
  // Reference resolver args don't have args argument (3 args instead of 4)
  const isReferenceResolver = args.length === 3;
  // Resolve type args don't have args argument and the last argument is the parent object type
  const isResolveType = !isReferenceResolver && isType(args[args.length - 1]);

  // Only create a new array when we need to insert undefined at position 1
  // This avoids array allocation for the common 4-argument case
  if (isReferenceResolver || isResolveType) {
    // Insert undefined at position 1: [root, ctx, info] -> [root, undefined, ctx, info]
    return [args[0], undefined, args[1], args[2], args[3]];
  }

  // Return original array for the common case (no mutation needed)
  return args;
}
