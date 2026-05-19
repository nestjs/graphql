import { isString } from '@nestjs/common/utils/shared.utils.js';
import { Federation2Config } from '../interfaces/index.js';
import { stringifyWithoutQuotes } from '../utils/index.js';

/**
 * @publicApi
 */
export class TypeDefsFederation2Decorator {
  decorate(typeDefs: string, config: Federation2Config = { version: 2 }) {
    const {
      directives = [
        '@authenticated',
        '@cacheTag',
        '@composeDirective',
        '@context',
        '@cost',
        '@extends',
        '@external',
        '@fromContext',
        '@inaccessible',
        '@interfaceObject',
        '@key',
        '@listSize',
        '@override',
        '@policy',
        '@provides',
        '@requires',
        '@requiresScopes',
        '@shareable',
        '@tag',
      ],
      importUrl = 'https://specs.apollo.dev/federation/v2.12',
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
