export interface InputTypeOptions {
  description?: string;
  isAbstract?: boolean;
}
export declare function InputType(): ClassDecorator;
export declare function InputType(options: InputTypeOptions): ClassDecorator;
export declare function InputType(
  name: string,
  options?: InputTypeOptions,
): ClassDecorator;
