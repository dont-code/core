import {dtcde} from './dontcode';
import {Core, Plugin, PluginConfig} from "./globals";

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

class PluginTest implements Plugin {
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
    // Nothing to do
  }
}
