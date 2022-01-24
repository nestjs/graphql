import { Logger } from '@nestjs/common';
import { ReturnTypeFunc } from '../interfaces/return-type-func.interface';
import { ResolveField, ResolveFieldOptions } from './resolve-field.decorator';

const logger = new Logger('GraphQLModule');

/**
 * Property resolver (method) Decorator.
 */
export function ResolveProperty(
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 */
export function ResolveProperty(
  propertyName?: string,
  typeFunc?: ReturnTypeFunc,
  options?: ResolveFieldOptions,
): MethodDecorator;
/**
 * Property resolver (method) Decorator.
 */
export function ResolveProperty(
  propertyNameOrFunc?: string | ReturnTypeFunc,
  typeFuncOrOptions?: ReturnTypeFunc | ResolveFieldOptions,
  options?: ResolveFieldOptions,
): MethodDecorator {
  logger.warn(
    'The "@ResolveProperty()" decorator has been deprecated. Please, use the "@ResolveField()" decorator instead.',
  );
  return ResolveField(
    propertyNameOrFunc as string,
    typeFuncOrOptions as ReturnTypeFunc,
    options,
  );
}
