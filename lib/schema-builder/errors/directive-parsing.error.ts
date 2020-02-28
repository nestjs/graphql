export class DirectiveParsingError extends Error {
  constructor(sdl: string) {
    super(
      `Directive SDL "${sdl}" is invalid. Please, pass a valid directive definition.`,
    );
  }
}
