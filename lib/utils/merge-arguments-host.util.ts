import { ArgumentsHost } from '@nestjs/common';

export const mergeArgumentsHost = <T extends ArgumentsHost>(
  host: ArgumentsHost,
): T =>
  (Object.assign(
    {
      getRoot: () => host.getArgByIndex(0),
      getArgs: () => host.getArgByIndex(1),
      getContext: () => host.getArgByIndex(2),
      getInfo: () => host.getArgByIndex(3),
    },
    host,
  ) as unknown) as T;
