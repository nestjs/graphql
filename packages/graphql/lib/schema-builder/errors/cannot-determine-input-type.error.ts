import { GqlTypeReference } from '../../interfaces';

export class CannotDetermineInputTypeError extends Error {
  constructor(hostType: string, typeRef?: GqlTypeReference) {
    const inputObjectName: string | false =
      typeof typeRef === 'function' && typeRef.name;
    super(
      `Cannot determine a GraphQL input type ${
        inputObjectName ? `("${inputObjectName}") ` : null
      }for the "${hostType}". Make sure your class is decorated with an appropriate decorator.`,
    );
  }
}
