import { Field, ID, ObjectType, Directive } from '../../../../../lib';

@Directive('@key(fields: "id")')
@ObjectType({ extendsObjectType: true })
export class User {
  @Directive('@external')
  @Field((type) => ID)
  id: string;

  @Directive('@external')
  @Field()
  name: string;

  @Directive('@requires(fields: "name")')
  @Field()
  nickname: string;
}
