import { Inject } from '@nestjs/common';
import { CONTEXT, Context, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class SharedContextResolver {
  static CONTEXTS: Record<string, any>[] = [];
  static BARRIER: Promise<void> | undefined;

  // Injecting CONTEXT makes this resolver request-scoped
  constructor(@Inject(CONTEXT) private readonly context: Record<string, any>) {}

  @Query(() => String)
  async requestId(@Context() context: Record<string, any>) {
    SharedContextResolver.CONTEXTS.push(context);
    // Lets a test hold concurrent requests here until all of them arrived
    await SharedContextResolver.BARRIER;

    if (context !== this.context) {
      throw new Error('CONTEXT was injected from another request');
    }
    return context.req.headers['x-request-id'];
  }
}
