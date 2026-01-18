import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Nested ObjectType that will cause the issue when
 * the app is initialized twice (globalSetup + test)
 */
@ObjectType()
export class NestedContent {
  @Field()
  text: string;

  @Field({ nullable: true })
  description?: string;

  constructor(data?: Partial<NestedContent>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
