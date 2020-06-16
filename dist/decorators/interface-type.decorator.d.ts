import { ResolveTypeFn } from '../interfaces';
export interface InterfaceTypeOptions {
  description?: string;
  isAbstract?: boolean;
  resolveType?: ResolveTypeFn<any, any>;
}
export declare function InterfaceType(
  options?: InterfaceTypeOptions,
): ClassDecorator;
export declare function InterfaceType(
  name: string,
  options?: InterfaceTypeOptions,
): ClassDecorator;
