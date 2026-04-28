import { Directive, Extensions } from '../decorators';
import { PropertyMetadata } from '../schema-builder/metadata';

export function applyFieldDecorators(
  targetClass: Function,
  item: PropertyMetadata,
) {
  if (item.extensions && Object.keys(item.extensions).length > 0) {
    Extensions(item.extensions)(targetClass.prototype, item.name);
  }
  if (item.directives?.length) {
    item.directives.forEach((directive) => {
      Directive(directive.sdl)(targetClass.prototype, item.name);
    });
  }
}
