import { Middleware } from '../../interfaces';

export interface MiddlewareMetadata {
  target: Function;
  middleware: Middleware[];
}

export interface PropertyMiddlewareMetadata extends MiddlewareMetadata {
  fieldName: string;
}
