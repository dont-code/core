import { DontCodeCore } from './dontcode';
import * as DontCode from './globals';
import PluginConfig = DontCode.PluginConfig;
import {Core, dtcde} from "./globals";

describe('dontcode', () => {
  it('should work', () => {
    const test =dtcde;
    expect(test).toBeDefined();
    expect(test.getSchemaManager()).toBeDefined();
  });

  it("should includes plugin's schema change", () => {
    const test = dtcde;

    test.registerPlugin(new PluginTest());
  });
});

class PluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'ScreenPlugin',
        'display-name': 'Dont code test Plugin adding screen types',
        version: '1.0.0',
      },
    };
  }

  pluginInit(dontCode: Core): void {
  }
}
