import { GqlTypeReference } from '../../interfaces';

export class CannotDetermineInputTypeError extends Error {
  constructor(hostType: string, typeRef?: GqlTypeReference) {
    const inputObjectName: string | false = typeof typeRef === 'function' && typeRef.name;
    super(
      `Cannot determine a GraphQL input type for the "${hostType}"${inputObjectName ? `, on "${inputObjectName}` : null}". Make sure your class is decorated with an appropriate decorator.`,
    );
  }
}
