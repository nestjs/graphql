import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind } from 'graphql';

@Scalar('SampleScalar')
export class SampleScalar implements CustomScalar<string, string> {
  description = 'A sample scalar';

  parseValue(value: unknown): string {
    if (typeof value !== 'string') {
      throw new Error(`Expected a string, but got ${value}.`);
    }
    return value;
  }

  serialize(obj: unknown): string {
    if (typeof obj !== 'string') {
      throw new Error(`Expected a string, but got ${obj}.`);
    }
    return obj;
  }

  parseLiteral(ast: any): string {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    throw new Error(
      `Expected value of kind 'STRING', but got kind '${ast.kind}'.`,
    );
  }
}
