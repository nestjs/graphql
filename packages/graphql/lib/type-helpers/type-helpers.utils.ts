import { Directive, Extensions } from '../decorators/index.js';
import { getUseFieldMiddleware } from '../decorators/use-field-middleware.decorator.js';
import { FIELD_MIDDLEWARE_METADATA } from '../graphql.constants.js';
import { PropertyMetadata } from '../schema-builder/metadata/index.js';

export function applyFieldDecorators(
  targetClass: Function,
  item: PropertyMetadata,
) {
  if (item.extensions && Object.keys(item.extensions).length > 0) {
    Extensions(item.extensions)(targetClass.prototype, item.name);
  }
  const middleware = getUseFieldMiddleware(item.target?.prototype, item.name);
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
