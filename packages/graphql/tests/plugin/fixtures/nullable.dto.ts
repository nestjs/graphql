export const nullableDtoText = `
enum Status {
    ENABLED,
    DISABLED
}

type Maybe<T> = T | undefined;

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
  both: string | null | undefined;
  bothOptional?: Date | null | undefined;
  status3: Status | undefined;
  statusArr2: Status[] | null | undefined;
  aliased: Maybe<string> | null;
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
        return { name: { nullable: true, type: () => String }, age: { type: () => Number }, tags: { type: () => [String] }, status: { type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, date: { nullable: true, type: () => Date }, both: { nullable: true, type: () => String }, bothOptional: { nullable: true, type: () => Date }, status3: { nullable: true, type: () => Status }, statusArr2: { nullable: true, type: () => [Status] }, aliased: { nullable: true, type: () => String } };
    }
};
NullableDto = __decorate([
    ObjectType()
], NullableDto);
export { NullableDto };
`;
