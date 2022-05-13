import { DontCodeCore } from '../dontcode';
import * as DontCode from '../globals';
import PluginConfig = DontCode.PluginConfig;
import {Core, dtcde} from "../globals";
import {DontCodePluginManager} from "@dontcode/core";

describe('Plugin Manager', () => {
  it('should work', () => {
    const test = new DontCodePluginManager();
    expect(test).toBeDefined();
  });

  it('should load definition-updates defined by plugins', () => {
    const test = new DontCodePluginManager();
  dtcde.getModelManager().resetContent( {
    creation: {
      name:'Test App',
      entities: {

      }
    }
  })

    test.registerPlugin(new PluginWithDefinitions(), dtcde.getSchemaManager(), dtcde.getPreviewManager());
    test.initPlugins(dtcde);

    const result =dtcde.getModelManager().getContent();

    expect(result.creation.entities).toEqual({
      'a': {
        name: 'Test'
      }
    });
  });

});


class PluginWithDefinitions implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'ValuesPlugin',
        'display-name': 'Dont code test Plugin with values ',
        version: '1.0.0',
      },
      'definition-updates': [
        {
          location: {
            parent: 'creation/entities',
            id: '*'
          },
          update: {
            name: 'Test'
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Nothing here
  }
}

