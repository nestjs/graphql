import { Directive, Extensions } from '../decorators/index.js';
import { getUseFieldMiddleware } from '../decorators/use-field-middleware.decorator.js';
import { FIELD_MIDDLEWARE_METADATA } from '../graphql.constants.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';

/**
 * Returns the middleware applied with `@UseFieldMiddleware()` to the field as
 * seen from the class a mapped type is built from. That class may decorate a
 * member it inherits without redeclaring `@Field()`, so its prototype (which
 * extends the inherited list) is consulted, not only the declaring class.
 */
export function getSourceFieldMiddleware(
  item: PropertyMetadata,
  sourceClass: Function | undefined = item.target,
) {
  if (
    !sourceClass ||
    !item.target ||
    sourceClass === item.target ||
    sourceClass.prototype instanceof item.target
  ) {
    return getUseFieldMiddleware(
      (sourceClass ?? item.target)?.prototype,
      item.name,
    );
  }
  return [
    ...new Set([
      ...getUseFieldMiddleware(item.target.prototype, item.name),
      ...getUseFieldMiddleware(sourceClass.prototype, item.name),
    ]),
  ];
}

export function applyFieldDecorators(
  targetClass: Function,
  item: PropertyMetadata,
  sourceClass?: Function,
) {
  if (item.extensions && Object.keys(item.extensions).length > 0) {
    Extensions(item.extensions)(targetClass.prototype, item.name);
  }
  const middleware = getSourceFieldMiddleware(item, sourceClass);
  if (middleware.length > 0) {
    // Replace rather than extend, so that re-applying the fields (e.g., from a
    // metadata refresh hook) does not register the same middleware twice.
    Reflect.defineMetadata(
      FIELD_MIDDLEWARE_METADATA,
      middleware,
      targetClass.prototype,
      item.name,
    );
  }
  if (item.directives?.length) {
    item.directives.forEach((directive) => {
      Directive(directive.sdl)(targetClass.prototype, item.name);
    });
  }
}
