/**
 * Counts the number of arguments for a given function. This algorithm isn't tested for all cases
 * (check in the spec file), so use it carefully, since it relies on getting the function as a string.
 * Note this also counts parameters with default initializers (as opposed to checking `function.length`)
 * @param fn The function to get the number of arguments
 * @returns the number of arguments in the function's signature
 */
export function getNumberOfArguments(fn: Function): number | undefined {
  // Removing newlines is necessary to use easier regex and handle multi-line functions
  const functionAsStringWithoutNewLines = fn.toString().replace(/\n/g, '');

  const [firstParenthesisIndex, lastParenthesisIndex] = getSubstring(
    functionAsStringWithoutNewLines,
    '(',
    ')',
  );

  if (lastParenthesisIndex != null && firstParenthesisIndex != null) {
    let functionParametersAsString = functionAsStringWithoutNewLines.substring(
      firstParenthesisIndex + 1,
      lastParenthesisIndex,
    );

    if (functionParametersAsString === '') {
      return 0;
    }

    // Removing arrays and objects is also necessary because we count the number of commas in the string,
    // and both could have commas and confuse the split process below.
    let res;
    while ((res = getSubstring(functionParametersAsString, '[', ']')) != null) {
      functionParametersAsString = cut(functionParametersAsString, res);
    }

    while ((res = getSubstring(functionParametersAsString, '{', '}')) != null) {
      functionParametersAsString = cut(functionParametersAsString, res);
    }

    const argumentsArray = functionParametersAsString.split(',');
    return argumentsArray.length;
  }

  return 0;
}

function cut(
  value: string,
  [startIndex, endIndex]: [number, number] | [] = [],
): string {
  if (startIndex == null || endIndex == null) {
    return value;
  }

  return value.substring(0, startIndex) + value.substring(endIndex + 1);
}

function getSubstring(
  value: string,
  startChar: string,
  endChar: string,
): [number, number] | undefined {
  const firstParenthesisIndex = value.indexOf(startChar);
  let lastParenthesisIndex;
  let nestedParenthesis = 0;
  for (let i = firstParenthesisIndex + 1; i <= value.length; i++) {
    const char = value[i];
    if (char === endChar && nestedParenthesis === 0) {
      lastParenthesisIndex = i;
      break;
    }
    if (char === startChar) {
      nestedParenthesis++;
    }
    if (char === endChar) {
      nestedParenthesis--;
    }
  }

  if (lastParenthesisIndex > firstParenthesisIndex) {
    return [firstParenthesisIndex, lastParenthesisIndex];
  }

  return undefined;
}
