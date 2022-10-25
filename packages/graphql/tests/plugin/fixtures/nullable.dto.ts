export const nullableDtoText = `
enum Status {
    ENABLED,
    DISABLED
}

@ObjectType()
export class NullableDto {
  name: string | null;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status | null;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date | undefined;
}
`;

export const nullableDtoTextTranspiled = `var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
let NullableDto = class NullableDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { nullable: true, type: () => String }, age: { type: () => Number }, tags: { type: () => [String] }, status: { type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, date: { nullable: true, type: () => Date } };
    }
};
NullableDto = __decorate([
    ObjectType()
], NullableDto);
export { NullableDto };
`;
