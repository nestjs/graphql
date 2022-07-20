import { isString } from '@nestjs/common/utils/shared.utils';
import { Federation2Config } from '../interfaces';
import { stringifyWithoutQuotes } from '../utils';

export class TypeDefsFederation2Decorator {
  decorate(typeDefs: string, config: Federation2Config = { version: 2 }) {
    const {
      directives = [
        '@key',
        '@shareable',
        '@external',
        '@override',
        '@requires',
      ],
      importUrl = 'https://specs.apollo.dev/federation/v2.0',
    } = config;
    const mappedDirectives = directives
      .map((directive) => {
        if (!isString(directive)) {
          return stringifyWithoutQuotes(directive);
        }
        let finalDirective = directive;
        if (!directive.startsWith('@')) {
          finalDirective = `@${directive}`;
        }
        return `"${finalDirective}"`;
      })
      .join(', ');

    return `
      extend schema @link(url: "${importUrl}", import: [${mappedDirectives}])
      ${typeDefs}
    `;
  }
}
