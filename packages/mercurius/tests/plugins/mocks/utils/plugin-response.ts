import { PluginResponse } from '../interfaces/plugin-response.interface';

export function pluginResponse(url: string): PluginResponse {
  return {
    from: url,
  };
}
