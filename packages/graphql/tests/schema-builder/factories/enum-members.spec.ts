import { Test } from '@nestjs/testing';
import { GraphQLEnumType, GraphQLSchema } from 'graphql';
import {
  Args,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  Query,
  registerEnumType,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

enum PageSize {
  SMALL = 10,
  LARGE = 100,
  ALL = Infinity,
  UNSET = NaN,
}
registerEnumType(PageSize, { name: 'PageSize' });

enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
}
namespace OrderStatus {
  export function isFinal(status: OrderStatus) {
    return status === OrderStatus.SHIPPED;
  }
  export const ALL: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.SHIPPED];
  export const LABELS = { PENDING: 'Pending' };
}
registerEnumType(OrderStatus, { name: 'OrderStatus' });

@Resolver()
class OrdersResolver {
  @Query(() => String)
  orders(
    @Args('pageSize', { type: () => PageSize, defaultValue: 'ALL' })
    pageSize: PageSize,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ): string {
    return 'ok';
  }
}

describe('Enum members', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef.get(GraphQLSchemaFactory).create([OrdersResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  const getValues = (name: string) =>
    (schema.getType(name) as GraphQLEnumType)
      .getValues()
      .map(({ name, value }) => [name, value]);

  it('should not turn the reverse mapping of a non-finite member into a value', () => {
    expect(getValues('PageSize')).toEqual([
      ['SMALL', 10],
      ['LARGE', 100],
      ['ALL', Infinity],
      ['UNSET', NaN],
    ]);
  });

  it('should not turn the exports of a merged namespace into values', () => {
    expect(getValues('OrderStatus')).toEqual([
      ['PENDING', 'PENDING'],
      ['SHIPPED', 'SHIPPED'],
    ]);
  });

  it('should translate a default value given as the key of a member', () => {
    const [pageSize] = schema.getQueryType().getFields().orders.args;
    expect(pageSize.defaultValue).toBe(Infinity);
  });
});
