import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * The shape the data source hands back. Deliberately *not* a GraphQL type -
 * the interceptor is what turns it into one.
 */
export class CommentEntity {
  id: string;
  text: string;
  postId: string;
}

@ObjectType()
export class CommentNode {
  @Field(() => ID)
  id: string;

  /** Renamed from `CommentEntity#text` by the mapper. */
  @Field()
  body: string;
}

@ObjectType()
export class CommentEdge {
  @Field()
  cursor: string;

  @Field(() => CommentNode)
  node: CommentNode;
}

@ObjectType()
export class CommentPageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string;

  @Field(() => String, { nullable: true })
  endCursor?: string;
}

@ObjectType()
export class CommentConnection {
  @Field(() => [CommentEdge])
  edges: CommentEdge[];

  @Field(() => CommentPageInfo)
  pageInfo: CommentPageInfo;

  @Field(() => Int)
  totalCount: number;
}
