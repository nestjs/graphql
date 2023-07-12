export const SERIALIZED_METADATA = {
  '@nestjs/graphql': {
    models: [
      [
        import('./base-type.fixture'),
        {
          BaseType: {
            meta: {
              type: () => String,
            },
          },
        },
      ],
      [
        import('./create-user-dto.fixture'),
        {
          CreateUserDto: {
            active: {
              type: () => Boolean,
            },
          },
        },
      ],
    ],
  },
}