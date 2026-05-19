import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver.js';

@Module({
  providers: [ProductsResolver],
})
export class ProductsModule {}
