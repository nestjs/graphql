import { isAbsolute, win32 } from 'path';
import { glob } from 'tinyglobby';
import type { GlobOptions } from 'tinyglobby';

type GlobPattern = string | string[];

export async function globPaths(
  patterns: GlobPattern,
  options: Omit<
    GlobOptions,
    'absolute' | 'expandDirectories' | 'patterns'
  > = {},
): Promise<string[]> {
  const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
  const negativePatterns = patternsArray.filter(isNegativePattern);
  const positivePatterns = patternsArray.filter(
    (pattern) => !isNegativePattern(pattern),
  );
  const globOptions = {
    ...options,
    expandDirectories: false,
  };

  const matches = await Promise.all(
    positivePatterns.map((pattern) =>
      glob([pattern, ...negativePatterns], {
        ...globOptions,
        absolute: isAbsoluteGlob(pattern),
      }),
    ),
  );

  return [...new Set(matches.flat())];
}

function isNegativePattern(pattern: string): boolean {
  return pattern[0] === '!' && pattern[1] !== '(';
}

function isAbsoluteGlob(pattern: string): boolean {
  return isAbsolute(pattern) || win32.isAbsolute(pattern);
}
