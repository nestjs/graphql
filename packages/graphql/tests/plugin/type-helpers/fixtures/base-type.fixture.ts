import { Directive, Extensions, Field, ObjectType } from '../../../../lib/decorators';

@ObjectType({ isAbstract: true })
export abstract class BaseType {
  @Field()
  @Directive('@upper')
  @Extensions({ extension: true })
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  meta: string;
}