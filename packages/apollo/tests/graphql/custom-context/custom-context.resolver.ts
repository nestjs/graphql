import { Resolver, Query, Context } from '@nestjs/graphql';

@Resolver()
export class CustomContextResolver {
  @Query(() => String)
  fooFromContext(@Context() ctx: Record<string, unknown>) {
    return ctx.foo;
  }
}
