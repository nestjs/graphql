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
  name: string;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  readonly breed?: string | undefined;
  nodes: Node[];
  alias: AliasedType;
  numberAlias: NumberAlias;
  union: 1 | 2;
  intersection: Function & string;
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
        return { name: { nullable: false, type: () => String }, age: { nullable: false, type: () => Number }, tags: { nullable: false, type: () => [String] }, status: { nullable: false, type: () => Status }, breed: { nullable: true, type: () => String }, nodes: { nullable: false, type: () => [Object] }, alias: { nullable: false, type: () => Object }, numberAlias: { nullable: false, type: () => Number }, union: { nullable: false, type: () => Object }, intersection: { nullable: false, type: () => Object }, nested: { nullable: false, type: () => ({ first: { nullable: false, type: () => String }, second: { nullable: false, type: () => Number }, status: { nullable: false, type: () => Status }, tags: { nullable: false, type: () => [String] }, nodes: { nullable: false, type: () => [Object] }, alias: { nullable: false, type: () => Object }, numberAlias: { nullable: false, type: () => Number } }) } };
    }
}
`;
