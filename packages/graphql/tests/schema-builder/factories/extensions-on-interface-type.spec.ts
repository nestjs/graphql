import { Test } from '@nestjs/testing';
import { GraphQLSchema } from 'graphql';
import {
  Extensions,
  Field,
  GraphQLSchemaBuilderModule,
  GraphQLSchemaFactory,
  ID,
  InterfaceType,
  ObjectType,
  Query,
  Resolver,
  TypeMetadataStorage,
} from '../../../lib/index.js';

@Extensions({ role: 'admin' })
@InterfaceType()
abstract class InternalResource {
  @Field(() => ID)
  id: string;
}

@Extensions({ role: 'admin' })
@ObjectType({ implements: () => [InternalResource] })
class Payslip implements InternalResource {
  id: string;
}

@Resolver()
class PayslipResolver {
  @Query(() => Payslip)
  payslip(): Payslip {
    return null;
  }
}

describe('@Extensions() on an @InterfaceType() class', () => {
  let schema: GraphQLSchema;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();
    schema = await moduleRef
      .get(GraphQLSchemaFactory)
      .create([PayslipResolver]);
  });

  afterAll(() => {
    TypeMetadataStorage.clear();
  });

  it('should add the extensions to the interface type, as for object types', () => {
    expect(schema.getType('Payslip').extensions).toEqual({ role: 'admin' });
    expect(schema.getType('InternalResource').extensions).toEqual({
      role: 'admin',
    });
  });
});
