import { PluginResponse } from '../interfaces/plugin-response.interface.js';

export function pluginResponse(url: string): PluginResponse {
  return {
    from: url,
  };
}
