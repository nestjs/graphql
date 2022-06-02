export function getNumberOfArguments(fn: Function): number | undefined {
  const functionAsString = fn.toString();

  const anythingEnclosedInParenthesesRegex = /\(.+\)/;

  const parametersEnclosedInParentheses = functionAsString.match(
    new RegExp(anythingEnclosedInParenthesesRegex),
  );

  if (parametersEnclosedInParentheses) {
    const matchString = parametersEnclosedInParentheses[0];
    const argumentsArray = matchString.split(',');
    return argumentsArray.length;
  }

  return 0;
}
