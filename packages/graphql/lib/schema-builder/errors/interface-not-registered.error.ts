export class InterfaceNotRegisteredError extends Error {
  constructor(hostTypeName: string, interfaceRef: unknown) {
    const interfaceName =
      (interfaceRef && (interfaceRef as Function).name) || String(interfaceRef);
    super(
      `"${hostTypeName}" lists "${interfaceName}" in its "implements" option, but ` +
        `"${interfaceName}" is not registered as an @InterfaceType(). ` +
        `Make sure every class referenced from "implements" is decorated with @InterfaceType().`,
    );
  }
}
