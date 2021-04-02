export const createNullCatDtoText = `
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
  name: string | null;
  age: number = 3;
  tags: string[];
  status: Status = Status.ENABLED;
  status2?: Status | null;
  statusArr?: Status[];
  readonly breed?: string;
  nodes: Node[];
  date: Date;
  nil: null;

  @HideField()
  hidden: number;

  static staticProperty: string;
}
`;

export const createNullCatDtoTextTranspiled = `var Status;
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
        return { name: { nullable: true, type: () => Object }, age: { nullable: false, type: () => Number }, tags: { nullable: false, type: () => [String] }, status: { nullable: false, type: () => Status }, status2: { nullable: true, type: () => Object }, statusArr: { nullable: true, type: () => [Status] }, breed: { nullable: true, type: () => String }, nodes: { nullable: false, type: () => [Object] }, date: { nullable: false, type: () => Date }, nil: { nullable: true, type: () => Object } };
    }
}
__decorate([
    HideField()
], CreateCatDto.prototype, \"hidden\", void 0);
`
