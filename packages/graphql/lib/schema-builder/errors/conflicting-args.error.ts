export class ConflictingArgsError extends Error {
  constructor(conflict: string) {
    super(
      `${conflict} Declare each argument once (or identically in every @Args() parameter), and do not rename an @ArgsType() property to, or from, the name of another argument of the same field.`,
    );
  }
}
