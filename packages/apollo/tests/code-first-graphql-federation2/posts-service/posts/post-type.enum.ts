import { registerEnumType } from '@nestjs/graphql';

export enum PostType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
}

registerEnumType(PostType, {
  name: 'PostType',
});
