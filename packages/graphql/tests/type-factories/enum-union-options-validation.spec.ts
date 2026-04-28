import { ObjectType, Field, ID } from '../../lib';
import { createUnionType, registerEnumType } from '../../lib/type-factories';

@ObjectType()
class MemberA {
  @Field(() => ID)
  id: string;
}

@ObjectType()
class MemberB {
  @Field(() => ID)
  id: string;
}

enum SampleEnum {
  A = 'A',
  B = 'B',
}

describe('registerEnumType / createUnionType options validation', () => {
  it('should throw a descriptive error when registerEnumType is called without options', () => {
    expect(() =>
      (registerEnumType as unknown as (ref: object) => void)(SampleEnum),
    ).toThrowError(/registerEnumType requires an "options" object/);
  });

  it('should throw a descriptive error when registerEnumType is called without a name', () => {
    expect(() =>
      registerEnumType(SampleEnum, {} as unknown as { name: string }),
    ).toThrowError(/non-empty "name"/);
  });

  it('should throw a descriptive error when createUnionType is called without options', () => {
    expect(() =>
      (
        createUnionType as unknown as () => unknown
      )(),
    ).toThrowError(/createUnionType requires an "options" object/);
  });

  it('should throw a descriptive error when createUnionType is called without a name', () => {
    expect(() =>
      createUnionType({
        types: () => [MemberA, MemberB] as const,
      } as unknown as { name: string; types: () => readonly [typeof MemberA] }),
    ).toThrowError(/non-empty "name"/);
  });

  it('should throw a descriptive error when createUnionType is called without a types function', () => {
    expect(() =>
      createUnionType({
        name: 'BadUnion',
      } as unknown as {
        name: string;
        types: () => readonly [typeof MemberA];
      }),
    ).toThrowError(/"options\.types" to be a function/);
  });

  it('should accept a fully formed options object', () => {
    expect(() =>
      registerEnumType(SampleEnum, { name: 'SampleEnum' }),
    ).not.toThrow();
    expect(() =>
      createUnionType({
        name: 'SampleUnion',
        types: () => [MemberA, MemberB] as const,
      }),
    ).not.toThrow();
  });
});
