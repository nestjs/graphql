import 'reflect-metadata';
import { ENTRY_PROVIDER_WATERMARK } from '@nestjs/common/constants.js';
import {
  Field,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '../../lib/decorators/index.js';
import { RESOLVER_TYPE_METADATA } from '../../lib/graphql.constants.js';
import { extractMetadata } from '../../lib/utils/extract-metadata.util.js';

describe('@Resolver decorator', () => {
  @ObjectType()
  class User {
    @Field(() => String)
    iban: string;
  }

  @ObjectType()
  class Admin {
    @Field(() => String)
    iban: string;
  }

  @Resolver(() => User)
  class UserFieldsResolver {
    @ResolveField(() => String)
    iban() {
      return '';
    }
  }

  const keepAll = () => false;

  it('should keep the type of the parent resolver for a bare "@Resolver()"', () => {
    @Resolver()
    class UsersResolver extends UserFieldsResolver {
      @Query(() => User)
      user() {
        return {};
      }
    }

    expect(Reflect.getMetadata(RESOLVER_TYPE_METADATA, UsersResolver)).toBe(
      'User',
    );
    const instance = new UsersResolver();
    expect(
      extractMetadata(instance, UsersResolver.prototype, 'iban', keepAll),
    ).toMatchObject({ type: 'User', name: 'iban', isTypeReference: true });
  });

  it('should keep the type of the parent resolver for "@Resolver({ ... })"', () => {
    @Resolver({ isAbstract: false })
    class UsersResolver extends UserFieldsResolver {}

    expect(Reflect.getMetadata(RESOLVER_TYPE_METADATA, UsersResolver)).toBe(
      'User',
    );
  });

  it('should let a subclass override the type of its parent resolver', () => {
    @Resolver('Admin')
    class AdminsResolver extends UserFieldsResolver {}

    @Resolver(() => Admin)
    class TypedAdminsResolver extends UserFieldsResolver {}

    expect(Reflect.getMetadata(RESOLVER_TYPE_METADATA, AdminsResolver)).toBe(
      'Admin',
    );
    expect(
      extractMetadata(
        new AdminsResolver(),
        AdminsResolver.prototype,
        'iban',
        keepAll,
      ),
    ).toMatchObject({ type: 'Admin', isTypeReference: false });
    expect(
      Reflect.getMetadata(RESOLVER_TYPE_METADATA, TypedAdminsResolver),
    ).toBe('Admin');
  });

  it('should mark the class of a method decorated with "@Resolver()" as an entry provider', () => {
    class AuthorsResolver {
      @ResolveField()
      @Resolver('Author')
      posts() {
        return [];
      }
    }

    expect(Reflect.getMetadata(ENTRY_PROVIDER_WATERMARK, AuthorsResolver)).toBe(
      true,
    );
  });
});
