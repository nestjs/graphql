import { GqlTypeReference } from '../../interfaces/index.js';

export class CannotDetermineInputTypeError extends Error {
  constructor(
    hostType: string,
    typeRef?: GqlTypeReference,
    isRegisteredAsObjectType?: boolean,
  ) {
    const inputObjectName: string | false =
      typeof typeRef === 'function' && typeRef.name;

    if (isRegisteredAsObjectType && inputObjectName) {
      super(
        `Cannot use "${inputObjectName}" as a GraphQL input type for the "${hostType}" field because it is decorated with @ObjectType(). ` +
          `Input types cannot reference object types. ` +
          `Create a separate class decorated with @InputType() for "${inputObjectName}", ` +
          `or pass \`InputType\` as the second argument to the mapped-type helper (e.g. PartialType(${inputObjectName}, InputType)) so that it is registered as an input type.`,
      );
      return;
    }

    super(
      `Cannot determine a GraphQL input type ${
        inputObjectName ? `("${inputObjectName}")` : null
      } for the "${hostType}". Make sure your class is decorated with an appropriate decorator.`,
    );
  }
}
