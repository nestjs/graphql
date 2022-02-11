import { GqlTypeReference } from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';

export interface BaseArgMetadata {
  target: Function;
  methodName: string;
  typeFn: (type?: any) => GqlTypeReference;
  options: TypeOptions;
  index: number;
}

export interface ArgParamMetadata extends BaseArgMetadata {
  kind: 'arg';
  name: string;
  description?: string;
}

export interface ArgsParamMetadata extends BaseArgMetadata {
  kind: 'args';
}

export type MethodArgsMetadata = ArgParamMetadata | ArgsParamMetadata;
