export const deprecationDtoText = `
@ObjectType()
export class CreateCatDto2 {
  /**
  * name description
  *
  * @deprecated
  */
  name: string;

  /**
  * @deprecated consult docs for better alternative!
  */
  breed: string;
}
`;

export const deprecationDtoTranspiled = `let CreateCatDto2 = class CreateCatDto2 {
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String, description: "name description", deprecationReason: "deprecated" }, breed: { type: () => String, deprecationReason: "consult docs for better alternative!" } };
    }
};
CreateCatDto2 = __decorate([
    ObjectType()
], CreateCatDto2);
export { CreateCatDto2 };
`;

export const deprecationInputDtoText = `
@InputType()
export class UpdateCatInput {
  /**
  * Current name of the cat.
  *
  * @deprecated Use 'newName' instead.
  */
  name: string;

  /**
  * Current breed of the cat.
  *
  * @deprecated This field will be removed in future versions.
  */
  breed: string;
}
`;
export const deprecationInputDtoTranspiled = `let UpdateCatInput = class UpdateCatInput {
    static _GRAPHQL_METADATA_FACTORY() {
        return {
            name: { type: () => String, description: "Current name of the cat.", deprecationReason: "Use 'newName' instead." },
            breed: { type: () => String, deprecationReason: "This field will be removed in future versions." }
        };
    }
};
UpdateCatInput = __decorate([
    InputType()
], UpdateCatInput);
export { UpdateCatInput };
`;
