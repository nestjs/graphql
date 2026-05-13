import { Type } from '@nestjs/common';

export class UnionMemberNotObjectTypeError extends Error {
  constructor(unionName: string, memberRef: Type<unknown>) {
    const memberName =
      (memberRef && (memberRef as Function).name) || String(memberRef);
    super(
      `Cannot build the "${unionName}" union: its member "${memberName}" is not registered as a @ObjectType(). ` +
        `Make sure every class returned from the union's "types" function is decorated with @ObjectType().`,
    );
  }
}
