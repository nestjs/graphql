import {
  CanActivate,
  INestApplication,
  Injectable,
  Module,
  Type,
  UseGuards,
} from '@nestjs/common';
import {
  Field,
  GraphQLModule,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(): boolean {
    return false;
  }
}

@ObjectType()
class Account {
  @Field(() => String)
  iban: string;
}

@Injectable()
class AccountsService {
  findOne() {
    return { iban: 'DE89370400440532013000' };
  }
}

// A reusable module bundling an unguarded resolver
@Resolver(() => Account)
class AccountsResolver {
  constructor(protected readonly accountsService: AccountsService) {}

  @Query(() => Account)
  account() {
    return this.accountsService.findOne();
  }
}

@Module({
  providers: [AccountsService, AccountsResolver],
  exports: [AccountsService],
})
class AccountsModule {}

// The application guards the query by overriding it
@Resolver(() => Account)
class SecuredAccountsResolver extends AccountsResolver {
  @UseGuards(DenyGuard)
  @Query(() => Account, { description: 'Requires login' })
  override account() {
    return super.account();
  }
}

@Module({
  imports: [AccountsModule],
  providers: [SecuredAccountsResolver],
})
class SecuredAccountsModule {}

// The same overwrite inside one provider: a renamed redeclaration
function BaseResolver<T>(classRef: Type<T>): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {
    @Query(() => [classRef], { name: `findAll${classRef.name}` })
    findAll() {
      return [{ iban: 'DE89370400440532013000' }];
    }
  }
  return BaseResolverHost;
}

@ObjectType()
class Invoice {
  @Field(() => String)
  iban: string;
}

@Resolver(() => Invoice)
class InvoicesResolver extends BaseResolver(Invoice) {
  @UseGuards(DenyGuard)
  @Query(() => [Invoice], { name: 'findAllInvoice' })
  findAllForStaff() {
    return [{ iban: 'staff only' }];
  }
}

@Module({ providers: [InvoicesResolver] })
class InvoicesModule {}

describe('GraphQL - Precedence of a resolver over the resolver it extends', () => {
  let app: INestApplication;

  const createApp = async (imports: any[]) => {
    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
        }),
        ...imports,
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  };

  const query = (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

  afterEach(async () => {
    await app.close();
  });

  it.each([
    ['after', [SecuredAccountsModule]],
    ['before', [AccountsModule, SecuredAccountsModule]],
  ])(
    'should serve the guarded override when the base resolver is scanned %s it',
    async (_, imports) => {
      await createApp(imports);

      const { body } = await query('{ account { iban } }');
      expect(body.data).toBeNull();
      expect(body.errors[0].message).toBe('Forbidden resource');
    },
  );

  it('should serve a redeclaration over the method it replaces', async () => {
    await createApp([InvoicesModule]);

    const { body } = await query('{ findAllInvoice { iban } }');
    expect(body.data).toBeNull();
    expect(body.errors[0].message).toBe('Forbidden resource');
  });
});
