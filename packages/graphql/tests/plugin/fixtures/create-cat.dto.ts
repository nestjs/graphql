export const createCatDtoText = `
enum Status {
    ENABLED,
    DISABLED
}

enum OneValueEnum {
    ONE
}

interface Node {
    id: number;
}

@ObjectType()
export class CreateCatDto {
  name: string;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date;

  @HideField()
  hidden: number;

  static staticProperty: string;
}

@InputType()
export class CreateCatInput {
  name: string;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date;

  @HideField()
  hidden: number;

  static staticProperty: string;
}

@ArgsType()
export class CreateCatArgs {
  name: string;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date;

  @HideField()
  hidden: number;

  static staticProperty: string;

  input: CreateCatInput;
}
`;

export const createCatDtoTextTranspiled = `var Status;
(function (Status) {
    Status[Status["ENABLED"] = 0] = "ENABLED";
    Status[Status["DISABLED"] = 1] = "DISABLED";
})(Status || (Status = {}));
var OneValueEnum;
(function (OneValueEnum) {
    OneValueEnum[OneValueEnum["ONE"] = 0] = "ONE";
})(OneValueEnum || (OneValueEnum = {}));
let CreateCatDto = class CreateCatDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, age: { type: () => Number }, tags: { type: () => [String] }, status: { type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, date: { type: () => Date } };
    }
};
__decorate([
    HideField()
], CreateCatDto.prototype, "hidden", void 0);
CreateCatDto = __decorate([
    ObjectType()
], CreateCatDto);
export { CreateCatDto };
let CreateCatInput = class CreateCatInput {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, age: { type: () => Number }, tags: { type: () => [String] }, status: { type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, date: { type: () => Date } };
    }
};
__decorate([
    HideField()
], CreateCatInput.prototype, \"hidden\", void 0);
CreateCatInput = __decorate([
    InputType()
], CreateCatInput);
export { CreateCatInput };
let CreateCatArgs = class CreateCatArgs {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { type: () => String }, age: { type: () => Number }, tags: { type: () => [String] }, status: { type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { type: () => [Object] }, date: { type: () => Date }, input: { type: () => require(\"./create-cat.input\").CreateCatInput } };
    }
};
__decorate([
    HideField()
], CreateCatArgs.prototype, \"hidden\", void 0);
CreateCatArgs = __decorate([
    ArgsType()
], CreateCatArgs);
export { CreateCatArgs };
`;
