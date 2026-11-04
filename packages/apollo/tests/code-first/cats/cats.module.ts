import { Module, Type } from '@nestjs/common';
import { CatsResolver } from './cats.resolver.js';

@Module({})
export class CatsModule {
  static register(
    resolverRegistrationMethod: 'useClass' | 'useFactory' | 'useValue',
    resolver: Type<any> = CatsResolver,
    token: string | symbol | Type<any> = resolver,
  ) {
    switch (resolverRegistrationMethod) {
      case 'useClass':
        return {
          module: CatsModule,
          providers: [
            {
              provide: token,
              useClass: resolver,
            },
          ],
        };

      case 'useValue':
        return {
          module: CatsModule,
          providers: [
            {
              provide: token,
              useValue: new resolver(),
            },
          ],
        };

      case 'useFactory':
      default:
        return {
          module: CatsModule,
          providers: [
            {
              provide: token,
              useFactory() {
                return new resolver();
              },
            },
          ],
        };
    }
  }
}
