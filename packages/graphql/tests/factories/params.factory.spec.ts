import { GqlParamtype } from '../../lib/enums/gql-paramtype.enum.js';
import { GqlParamsFactory } from '../../lib/factories/params.factory.js';

describe('GqlParamsFactory', () => {
  const factory = new GqlParamsFactory();
  const getArg = (name: string, args: object) =>
    factory.exchangeKeyForValue(GqlParamtype.ARGS, name, [{}, args, {}, {}]);

  it('should resolve an omitted argument named after an "Object.prototype" member to undefined', () => {
    // graphql-js hands resolvers a plain object, with "Object.prototype"
    expect(getArg('constructor', {})).toBeUndefined();
    expect(getArg('toString', {})).toBeUndefined();
    expect(getArg('hasOwnProperty', {})).toBeUndefined();
  });

  it('should resolve an argument named after an "Object.prototype" member when sent', () => {
    expect(getArg('constructor', { constructor: 'ferrari' })).toBe('ferrari');
    expect(getArg('toString', { toString: null })).toBeNull();
  });

  it('should resolve the other arguments as before', () => {
    expect(getArg('team', { team: 'ferrari' })).toBe('ferrari');
    expect(getArg('team', {})).toBeUndefined();

    class ArgsInstance {
      get computed() {
        return 'computed';
      }
    }
    expect(getArg('computed', new ArgsInstance())).toBe('computed');
  });
});
