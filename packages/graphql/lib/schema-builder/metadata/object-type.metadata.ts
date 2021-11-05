import { ClassMetadata } from './class.metadata';

export interface ObjectTypeMetadata extends ClassMetadata {
  interfaces?: Function | Function[] | (() => Function | Function[]);
}
