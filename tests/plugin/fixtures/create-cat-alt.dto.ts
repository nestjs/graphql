export const createCatDtoAltText = `
enum Status {
    ENABLED,
    DISABLED
}

interface Node {
    id: number;
}

type AliasedType = {
    type: string;
};
type NumberAlias = number;

@ObjectType()
export class CreateCatDto2 {
  /**
  * name description
  *  
  * @example 'test'
  * @example 'test2'
  * @memberof CreateCatDto2
  */
  name: string;

  // commentedOutProperty: string;

  /** test on age */
  age: number = 3;

  // test on tags (should be ignored)
  tags: string[];
  status: Status = Status.ENABLED;
  readonly breed?: string | undefined;
  nodes: Node[];
  alias: AliasedType;
  numberAlias: NumberAlias;
  union: 1 | 2;
  intersection: Function & string;
  optionalBoolean?: boolean;
  nested: {
      first: string,
      second: number,
      status: Status,
      tags: string[],
      nodes: Node[]
      alias: AliasedType,
      numberAlias: NumberAlias,
  },
  prop: {
    [x: string]: string;
  }
  tuple: [number, number];
}
`;

export const createCatDtoTextAltTranspiled = `var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
let CreateCatDto2 = class CreateCatDto2 {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String, description: "name description" }, age: { type: () => Number, description: "test on age" }, tags: { type: () => [String] }, status: { type: () => Status }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, alias: { type: () => Object }, numberAlias: { type: () => Number }, union: { type: () => Object }, intersection: { type: () => Object }, optionalBoolean: { nullable: true, type: () => Boolean }, nested: { type: () => Object }, prop: { type: () => Object }, tuple: { type: () => Object } };
    }
};
CreateCatDto2 = __decorate([
    ObjectType()
], CreateCatDto2);
export { CreateCatDto2 };
`;
