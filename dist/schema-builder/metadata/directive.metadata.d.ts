export interface DirectiveMetadata {
  sdl: string;
  target: Function;
}
export declare type ClassDirectiveMetadata = DirectiveMetadata;
export interface PropertyDirectiveMetadata extends DirectiveMetadata {
  fieldName: string;
}
