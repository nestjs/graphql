export interface PluginOptions {
  typeFileNameSuffix?: string | string[];
}
export declare const mergePluginOptions: (
  options?: Record<string, any>,
) => PluginOptions;
