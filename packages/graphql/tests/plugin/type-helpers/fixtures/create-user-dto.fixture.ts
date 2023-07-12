import { Transform } from 'class-transformer';
import { IsBoolean, MinLength } from 'class-validator';
import { Directive, Extensions, Field, ObjectType } from '../../../../lib/decorators';

@ObjectType()
export class CreateUserDto {
  @Transform((str) => str + '_transformed')
  @MinLength(10)
  @Field({ nullable: true })
  @Directive('@upper')
  login: string;

  @Transform((str) => str + '_transformed')
  @MinLength(10)
  @Field()
  @Directive('@upper')
  @Extensions({ extension: true })
  password: string;

  @Field({ name: 'id' })
  @Extensions({ extension: true })
  _id: string;

  @IsBoolean()
  active: boolean;
}