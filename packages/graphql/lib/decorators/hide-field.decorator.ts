/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
export function HideField(): PropertyDecorator {
  return (target: Record<string, any>, propertyKey: string | symbol) => {};
}
