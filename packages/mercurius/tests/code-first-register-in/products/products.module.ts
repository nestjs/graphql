import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';

@Module({
  providers: [ProductsResolver],
})
export class ProductsModule {}
