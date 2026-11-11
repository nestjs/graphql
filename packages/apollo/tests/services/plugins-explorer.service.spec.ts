import { Injectable, Scope } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import { Plugin } from '../../lib/decorators/plugin.decorator.js';
import { PluginsExplorerService } from '../../lib/services/plugins-explorer.service.js';

@Injectable({ scope: Scope.REQUEST })
class AuditLog {
  write() {}
}

@Plugin()
class SingletonPlugin {
  async requestDidStart() {}
}

@Plugin()
class ApiKeyPlugin {
  private readonly apiKey = 'secret';

  constructor(private readonly auditLog: AuditLog) {}

  async requestDidStart() {
    return this.apiKey;
  }
}

@Plugin()
@Injectable({ scope: Scope.TRANSIENT })
class TransientPlugin {
  async requestDidStart() {}
}

describe('PluginsExplorerService', () => {
  const explore = async (providers: any[]) => {
    const module = await Test.createTestingModule({ providers }).compile();
    const explorer = new PluginsExplorerService(module.get(ModulesContainer));
    try {
      return explorer.explore({});
    } finally {
      await module.close();
    }
  };

  it('should return the static plugins', async () => {
    const plugins = await explore([SingletonPlugin]);

    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toBeInstanceOf(SingletonPlugin);
  });

  it('should return a plugin exposed through an alias once', async () => {
    const plugins = await explore([
      SingletonPlugin,
      { provide: 'PLUGIN_ALIAS', useExisting: SingletonPlugin },
    ]);

    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toBeInstanceOf(SingletonPlugin);
  });

  it.each([
    ['depends on a request-scoped provider', [ApiKeyPlugin, AuditLog]],
    ['is transient', [TransientPlugin]],
  ])(
    'should refuse a plugin that %s, which would run unconstructed',
    async (_, providers) => {
      await expect(explore(providers)).rejects.toThrow(
        'plugin is request or transient-scoped, or depends on a request-scoped provider. Classes annotated with the "@Plugin()" decorator must be static (singleton).',
      );
    },
  );
});
