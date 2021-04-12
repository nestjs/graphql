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
    Status[Status[\"ENABLED\"] = 0] = \"ENABLED\";
    Status[Status[\"DISABLED\"] = 1] = \"DISABLED\";
})(Status || (Status = {}));
export class CreateCatDto2 {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { nullable: false, type: () => String, description: "name description" }, age: { nullable: false, type: () => Number, description: "test on age" }, tags: { nullable: false, type: () => [String] }, status: { nullable: false, type: () => Status }, breed: { nullable: true, type: () => String }, nodes: { nullable: false, type: () => [Object] }, alias: { nullable: false, type: () => Object }, numberAlias: { nullable: false, type: () => Number }, union: { nullable: false, type: () => Object }, intersection: { nullable: false, type: () => Object }, optionalBoolean: { nullable: true, type: () => Boolean }, nested: { nullable: false, type: () => ({ first: { nullable: false, type: () => String }, second: { nullable: false, type: () => Number }, status: { nullable: false, type: () => Status }, tags: { nullable: false, type: () => [String] }, nodes: { nullable: false, type: () => [Object] }, alias: { nullable: false, type: () => Object }, numberAlias: { nullable: false, type: () => Number } }) }, tuple: { nullable: false, type: () => Object } };
    }
}
`;
