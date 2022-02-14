import { MercuriusDriverPlugin } from '../../../lib/interfaces/mercurius-driver-plugin.interface';
import { NEW_URL } from '../contants';
import { MockPluginOptions } from '../interfaces/mock-plugin-options.interface';
import mockPlugin from '../mock.plugin';

export const optionsPlugin: MercuriusDriverPlugin<MockPluginOptions> = {
  plugin: mockPlugin,
  options: {
    url: NEW_URL,
  },
};

export const noOptionsPlugin: MercuriusDriverPlugin = {
  plugin: mockPlugin,
};
