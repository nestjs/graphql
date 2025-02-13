/**
 * @publicApi
 */
export function HideField(): PropertyDecorator {
  return (target: Record<string, any>, propertyKey: string | symbol) => {};
}
