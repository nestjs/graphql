import { ClassMetadata } from './class.metadata.js';

export interface ObjectTypeMetadata extends ClassMetadata {
  interfaces?: Function | Function[] | (() => Function | Function[]);
}
