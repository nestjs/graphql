import {
  Field,
  FieldMiddleware,
  IntersectionType,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  UseFieldMiddleware,
} from '../../lib/index.js';
import { getUseFieldMiddleware } from '../../lib/decorators/use-field-middleware.decorator.js';

const parentMiddleware: FieldMiddleware = (_, next) => next();
const childMiddleware: FieldMiddleware = (_, next) => next();
const otherMiddleware: FieldMiddleware = (_, next) => next();

@ObjectType()
class Employee {
  @Field()
  @UseFieldMiddleware(parentMiddleware)
  salary: string;

  @Field()
  name: string;
}

// Re-decorates an inherited member without redeclaring "@Field()"
@ObjectType()
class RestrictedEmployee extends Employee {
  @UseFieldMiddleware(childMiddleware)
  declare salary: string;
}

@ObjectType()
class Badge {
  @Field()
  @UseFieldMiddleware(otherMiddleware)
  salary: string;
}

describe('Mapped types and @UseFieldMiddleware() on inherited members', () => {
  it.each([
    ['PickType', () => PickType(RestrictedEmployee, ['salary'] as const)],
    ['OmitType', () => OmitType(RestrictedEmployee, ['name'] as const)],
    ['PartialType', () => PartialType(RestrictedEmployee)],
  ])(
    '%s should keep the middleware of the class it is built from',
    (_, createType) => {
      expect(getUseFieldMiddleware(createType().prototype, 'salary')).toEqual([
        parentMiddleware,
        childMiddleware,
      ]);
    },
  );

  it('IntersectionType should keep the middleware of both classes', () => {
    const type = IntersectionType(RestrictedEmployee, Badge);
    expect(getUseFieldMiddleware(type.prototype, 'salary')).toEqual([
      parentMiddleware,
      childMiddleware,
      otherMiddleware,
    ]);
  });

  it('should not change mapped types of the declaring class itself', () => {
    expect(
      getUseFieldMiddleware(
        PickType(Employee, ['salary'] as const).prototype,
        'salary',
      ),
    ).toEqual([parentMiddleware]);
  });
});
