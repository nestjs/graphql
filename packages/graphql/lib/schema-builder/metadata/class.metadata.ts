import { DirectiveMetadata } from './directive.metadata';
import { PropertyMetadata } from './property.metadata';

/**
 * Type for the registerIn option used in GraphQL type decorators.
 * Can be a module class directly or a function that returns the module class
 * (useful to avoid circular dependency issues).
 *
 * @publicApi
 */
export type RegisterInOption = Function | (() => Function);

export interface ClassMetadata {
  target: Function;
  name: string;
  description?: string;
  isAbstract?: boolean;
  directives?: DirectiveMetadata[];
  extensions?: Record<string, unknown>;
  properties?: PropertyMetadata[];
  inheritDescription?: boolean;
  isOneOf?: boolean; // For '@oneOf' input types
  /**
   * NestJS module that this type belongs to.
   * @see RegisterInOption for details
   */
  registerIn?: RegisterInOption;
}
