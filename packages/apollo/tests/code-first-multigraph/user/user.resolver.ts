import {
  Field,
  ObjectType,
  Resolver,
  Query,
  ID,
  Directive,
  Args,
  ResolveReference,
} from '@nestjs/graphql';

@ObjectType()
@Directive('@key(fields: "id")')
class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}

@Resolver(() => User)
export class UserResolver {
  private readonly store = new Set<User>([
    { id: 1, name: 'Luke' },
    { id: 2, name: 'Han' },
  ]);

  @Query(() => [User])
  users(): User[] {
    return [...this.store];
  }

  @Query(() => User)
  user(@Args('id', { type: () => ID }) id: number): User | undefined {
    for (const user of this.store) {
      if (user.id.toString() === id.toString()) {
        return user;
      }
    }
  }

  @ResolveReference()
  resolveReference(reference: {
    __typename: string;
    id: number;
  }): User | undefined {
    return this.user(reference.id);
  }
}
