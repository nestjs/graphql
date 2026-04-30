import { Query, Resolver } from '@nestjs/graphql';
import { Product } from './product.model';

@Resolver((of) => Product)
export class ProductsResolver {
  @Query((returns) => [Product])
  products(): Product[] {
    return [{ id: '1', name: 'Widget' }];
  }
}
