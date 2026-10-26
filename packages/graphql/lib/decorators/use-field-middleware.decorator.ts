import { FIELD_MIDDLEWARE_METADATA } from '../graphql.constants.js';
import { FieldMiddleware } from '../interfaces/field-middleware.interface.js';

/**
 * Applies field middleware to a field (`@Field()`) or a field resolver
 * (`@ResolveField()`). It can be placed above or below either decorator, and
 * composes well with `applyDecorators()`.
 *
 * Middleware runs in this order:
 * 1. global middleware (`buildSchemaOptions.fieldMiddleware`),
 * 2. middleware passed through the `middleware` option of `@Field()` or `@ResolveField()`,
 * 3. middleware applied with `@UseFieldMiddleware()`, in the order given.
 *
 * When the decorator is stacked, the middleware of the lowest one runs first
 * (as with `@UseGuards()`). A subclass that decorates an inherited member
 * extends the inherited list. For field resolvers, field middleware runs before
 * the enhancers enabled through `fieldResolverEnhancers` (guards, interceptors, filters).
 *
 * @param middleware one or more field middleware functions
 *
 * @see [Field middleware](https://docs.nestjs.com/graphql/field-middleware)
 *
 * @publicApi
 */
export function UseFieldMiddleware(
  ...middleware: FieldMiddleware[]
): PropertyDecorator & MethodDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: FieldMiddleware[] =
      Reflect.getMetadata(FIELD_MIDDLEWARE_METADATA, target, propertyKey) ?? [];
    Reflect.defineMetadata(
      FIELD_MIDDLEWARE_METADATA,
      [...existing, ...middleware],
      target,
      propertyKey,
    );
  };
}

/**
 * Returns the middleware applied with `@UseFieldMiddleware()` to the given member.
 */
export function getUseFieldMiddleware(
  target: object | undefined,
  propertyKey: string | symbol,
): FieldMiddleware[] {
  if (!target) {
    return [];
  }
  return (
    Reflect.getMetadata(FIELD_MIDDLEWARE_METADATA, target, propertyKey) ?? []
  );
}
