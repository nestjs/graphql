import { Field } from '../../../lib/decorators';

class Inner {
  test: string;
}

// It should expect the right primitive as defaultValue
class WrongPrimitive {
  // @ts-expect-error The defaultValue should be a boolean
  @Field(() => Boolean, { defaultValue: 'true' })
  bool: boolean;
}

class CorrectPrimitive {
  @Field(() => Boolean, { defaultValue: true })
  bool: boolean;
}

// It should expect the right object as defaultValue
class WrongObject {
  // @ts-expect-error The defaultValue should be of the shape of Inner
  @Field(() => Inner, { defaultValue: { success: true } })
  inner: Inner;
}

class CorrectObject {
  @Field(() => Inner, { defaultValue: { test: 'hello' } })
  inner: Inner;
}

// It should expect an Array as defaultValue
class WrongArray {
  // @ts-expect-error The defaultValue should be an Array
  @Field(() => [Inner], { defaultValue: { test: 'test' } })
  inners: Inner[];
}

class CorrectArray {
  @Field(() => [Inner], { defaultValue: [{ test: 'test' }] })
  inner: Inner;
}

describe('Field decorator (defaultValue)', () => {
  it('TypeScript should not complain about the type mismatch', () => {
    expect(true).toBeTruthy();
  });
});
