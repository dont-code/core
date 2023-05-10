import { dtcde } from '../dontcode';
import {Core, Plugin, PluginConfig} from '../globals';
import { DontCodePluginManager } from './dont-code-plugin-manager';

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

    test.registerPlugin(new PluginWithSingleDefinition(), dtcde.getSchemaManager(), dtcde.getPreviewManager());
    test.initPlugins(dtcde);

    let result =dtcde.getModelManager().getContent();

    expect(result.creation.entities).toEqual({
      'a': {
        name: 'Test'
      }
    });

    test.registerPlugin(new PluginWithDefinitions(), dtcde.getSchemaManager(), dtcde.getPreviewManager());
    test.initPlugins(dtcde);

    result =dtcde.getModelManager().getContent();

    expect(result.creation.entities).toEqual({
      'a': {
        name: 'Test'
      },
      'b': {
        name: 'BTest',
        source: 'BSource'
      }
    });
    expect(result.creation.sources).toEqual({
      'a': {
        name: 'BSource',
        type: 'Rest',
        url:  'https://test.test'
      }
    });
  });

});


class PluginWithSingleDefinition implements Plugin {
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

class PluginWithDefinitions implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'Values2Plugin',
        'display-name': 'Dont code test Plugin with multiple definitions ',
        version: '1.0.0',
      },
      'definition-updates': [
        {
          location: {
            parent: 'creation/entities',
            id: '*'
          },
          update: {
            name: 'BTest',
            source: 'BSource'
          },
        }, {
          location: {
            parent: 'creation/sources'
          },
          update: {
            name: 'BSource',
            type: 'Rest',
            url:  'https://test.test'

          }
        }
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Nothing here
  }
}
