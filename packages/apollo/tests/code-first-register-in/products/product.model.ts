import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ProductsModule } from './products.module';

@ObjectType({ registerIn: () => ProductsModule })
export class Product {
  @Field((type) => ID)
  id: string;

  @Field()
  name: string;
}
