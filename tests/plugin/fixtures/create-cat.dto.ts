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
`;

export const createCatDtoTextTranspiled = `var Status;
(function (Status) {
    Status[Status[\"ENABLED\"] = 0] = \"ENABLED\";
    Status[Status[\"DISABLED\"] = 1] = \"DISABLED\";
})(Status || (Status = {}));
var OneValueEnum;
(function (OneValueEnum) {
    OneValueEnum[OneValueEnum[\"ONE\"] = 0] = \"ONE\";
})(OneValueEnum || (OneValueEnum = {}));
export class CreateCatDto {
    constructor() {
        this.age = 3;
        this.status = Status.ENABLED;
    }
    static _GRAPHQL_METADATA_FACTORY() {
        return { name: { nullable: false, type: () => String }, age: { nullable: false, type: () => Number }, tags: { nullable: false, type: () => [String] }, status: { nullable: false, type: () => Status }, status2: { nullable: true, type: () => Status }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { nullable: false, type: () => [Object] }, date: { nullable: false, type: () => Date } };
    }
}
__decorate([
    HideField()
], CreateCatDto.prototype, \"hidden\", void 0);
`;
