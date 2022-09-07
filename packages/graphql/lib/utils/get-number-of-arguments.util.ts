/**
 * Counts the number of arguments for a given function. This algorithm isn't tested for all cases
 * (check in the spec file), so use it carefully, since it relies on getting the function as a string.
 * Note this also counts parameters with default initializers (as opposed to checking `function.length`)
 * @param fn The function to get the number of arguments
 * @returns the number of arguments in the function's signature
 */
export function getNumberOfArguments(fn: Function): number | undefined {
  // Removing newlines is necessary to use easier regex and handle multi-line functions
  const functionAsStringWithouNewLines = fn.toString().replace(/\n/g, '');

  const anythingEnclosedInParenthesesRegex = /\(.+\)/;

  const regexMatchedArray = functionAsStringWithouNewLines.match(
    new RegExp(anythingEnclosedInParenthesesRegex),
  );

  if (regexMatchedArray) {
    const functionParametersAsString = regexMatchedArray[0];

    // Removing arrays and objects is also necessary because we count the number of commas in the string,
    // and both could have commas and confuse the split process below.
    const parametersWithReplacedArraysAndObjects = functionParametersAsString
      .replace(/\[.+\]/g, '"array"')
      .replace(/(\{.+\})/g, '"object"');

    const argumentsArray = parametersWithReplacedArraysAndObjects.split(',');
    return argumentsArray.length;
  }

  return 0;
}
