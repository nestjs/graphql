export const nullableDtoText = `
enum Status {
    ENABLED,
    DISABLED
}

export class NullableDto {
  name: string | null;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status | null;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date;
}
`;

export const nullableDtoTextTranspiled = `var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
export class NullableDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { nullable: true, type: () => String }, age: { nullable: false, type: () => Number }, tags: { nullable: false, type: () => [String] }, status: { nullable: false, type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { nullable: false, type: () => [Object] }, date: { nullable: false, type: () => Date } };
    }
}
`
