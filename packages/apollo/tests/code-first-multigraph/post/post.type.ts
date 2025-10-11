import {
  registerEnumType,
  ObjectType,
  Directive,
  Field,
  ID,
} from '@nestjs/graphql';

export enum Publication {
  PUBLISHED,
  DRAFT,
}

registerEnumType(Publication, { name: 'Publication' });

@ObjectType()
@Directive('@key(fields: "id")')
export class Post {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Publication)
  status: Publication;

  @Field(() => ID)
  authorId: number;
}
