import { getNumberOfArguments, stringifyWithoutQuotes } from '../../lib/utils';

describe('getNumberOfArguments', () => {
  describe('when using function', () => {
    it('should return 0 for a 0-argument function', () => {
      function zeroArgFunction() {}
      expect(getNumberOfArguments(zeroArgFunction)).toBe(0);
    });

    it('should return 1 for a 1-argument function', () => {
      function oneArgFunction(_arg1: any) {}
      expect(getNumberOfArguments(oneArgFunction)).toBe(1);
    });

    it('should return 2 for a 2-argument function', () => {
      function twoArgFunction(_arg1: any, _arg2: any) {}
      expect(getNumberOfArguments(twoArgFunction)).toBe(2);
    });

    it('should return 2 for a 2-argument function, even if it has a default parameter', () => {
      function twoArgFunction(_arg1: any, _arg2 = 'text') {}
      expect(getNumberOfArguments(twoArgFunction)).toBe(2);
    });
  });

  describe('when using arrow function', () => {
    it('should return 0 for a 0-argument function', () => {
      const zeroArgFunction = () => {};
      expect(getNumberOfArguments(zeroArgFunction)).toBe(0);
    });

    it('should return 1 for a 1-argument function', () => {
      const oneArgFunction = (_arg1: any) => {};
      expect(getNumberOfArguments(oneArgFunction)).toBe(1);
    });

    it('should return 2 for a 2-argument function', () => {
      const twoArgFunction = (_arg1: any, _arg2: any) => {};
      expect(getNumberOfArguments(twoArgFunction)).toBe(2);
    });

    it('should return 2 for a 2-argument function, even if it has a default parameter', () => {
      const twoArgFunction = (_arg1: any, _arg2 = 1) => {};
      expect(getNumberOfArguments(twoArgFunction)).toBe(2);
    });
  });

  describe('when using class method', () => {
    class TestClass {
      methodZeroArguments() {}

      methodOneArgument(_arg: any) {}

      methodTwoArguments(_arg1: any, _arg2: any) {}

      methodTwoArgumentsOneOptional(_arg1: any, _arg2 = ['raw']) {}
    }

    const instance = new TestClass();

    it('should return 0 for a 0-argument function', () => {
      expect(getNumberOfArguments(instance.methodZeroArguments)).toBe(0);
    });

    it('should return 1 for a 1-argument function', () => {
      expect(getNumberOfArguments(instance.methodOneArgument)).toBe(1);
    });

    it('should return 2 for a 2-argument function', () => {
      expect(getNumberOfArguments(instance.methodTwoArguments)).toBe(2);
    });

    it('should return 2 for a 2-argument function, even if it has a default parameter', () => {
      expect(getNumberOfArguments(instance.methodTwoArgumentsOneOptional)).toBe(
        2,
      );
    });
  });

  describe('when using class static method', () => {
    class TestStaticClass {
      static methodZeroArguments() {}

      static methodOneArgument(_arg: any) {}

      static methodTwoArguments(_arg1: any, _arg2: any) {}

      static methodTwoArgumentsOneOptional(_arg1: any, _arg2 = ['raw']) {}
    }

    it('should return 0 for a 0-argument function', () => {
      expect(getNumberOfArguments(TestStaticClass.methodZeroArguments)).toBe(0);
    });

    it('should return 1 for a 1-argument function', () => {
      expect(getNumberOfArguments(TestStaticClass.methodOneArgument)).toBe(1);
    });

    it('should return 2 for a 2-argument function', () => {
      expect(getNumberOfArguments(TestStaticClass.methodTwoArguments)).toBe(2);
    });

    it('should return 2 for a 2-argument function, even if it has a default parameter', () => {
      expect(
        getNumberOfArguments(TestStaticClass.methodTwoArgumentsOneOptional),
      ).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should not count an "empty" argument when the function ends with a comma', () => {
      // prettier-ignore
      function functionEndingWithComma(_arg1, _arg2,) {}

      expect(getNumberOfArguments(functionEndingWithComma)).toBe(2);
    });

    it('should count correctly for multi-lined functions', () => {
      // prettier-ignore
      function multiLineFunction(
        _arg1 = 1,
        _arg2 = 2,
        _arg3 = 3,
      ) {}

      expect(getNumberOfArguments(multiLineFunction)).toBe(3);
    });

    it('should count correctly for functions containing arrays as default values', () => {
      function functionWithArray(_arg1 = 1, _arg2 = [1, 2, 3]) {}

      expect(getNumberOfArguments(functionWithArray)).toBe(2);
    });

    it('should count correctly for functions containing objects as default values', () => {
      function functionWithArray(_arg1 = 1, _arg2 = { a: 1, b: 2 }) {}

      expect(getNumberOfArguments(functionWithArray)).toBe(2);
    });

    it('should count correctly for functions containing both objects and arrays as default values', () => {
      function functionWithArray(_arg1 = [1, 2, 3], _arg2 = { a: 1, b: 2 }) {}

      expect(getNumberOfArguments(functionWithArray)).toBe(2);
    });
  });
});

describe('stringifyWithoutQuotes', () => {
  it('should stringify object correctly', () => {
    const obj = {
      name: '@tag',
      as: '@mytag',
    };

    expect(stringifyWithoutQuotes(obj)).toBe('{ name: "@tag", as: "@mytag" }');
  });
});
