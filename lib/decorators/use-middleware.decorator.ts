/**
 * The API surface of this module has been heavily inspired by the "type-graphql" library (https://github.com/MichalLytek/type-graphql), originally designed & released by Michal Lytek.
 * In the v6 major release of NestJS, we introduced the code-first approach as a compatibility layer between this package and the `@nestjs/graphql` module.
 * Eventually, our team decided to reimplement all the features from scratch due to a lack of flexibility.
 * To avoid numerous breaking changes, the public API is backward-compatible and may resemble "type-graphql".
 */
import { LazyMetadataStorage } from '../schema-builder/storages/lazy-metadata.storage';
import { TypeMetadataStorage } from '../schema-builder/storages/type-metadata.storage';
import { Middleware } from '../interfaces';

export function UseMiddleware(
  ...middleware: Array<Middleware>
): PropertyDecorator & MethodDecorator {
  return (
    prototype: Object,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    addMiddlewareMetadata(middleware, prototype, propertyKey, descriptor);
  };
}

export function addMiddlewareMetadata(
  middleware: Middleware[],
  prototype: Object,
  propertyKey?: string,
  _descriptor?: TypedPropertyDescriptor<any>,
) {
  LazyMetadataStorage.store(() => {
    TypeMetadataStorage.addMiddlewarePropertyMetadata({
      target: prototype.constructor,
      fieldName: propertyKey,
      middleware,
    });
  });
}
