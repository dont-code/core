import {dtcde} from '../../dontcode';
import {Core, PluginConfig, Plugin} from '../../globals';

describe('Preview Manager', () => {
  it('should work', () => {
    const test = dtcde.reset();
    expect(test).toBeDefined();
    expect(test.getPreviewManager()).toBeDefined();
  });

  it('should manage simple plugin configuration', () => {
    const test = dtcde.reset();

    test.registerPlugin(new SimplePluginTest());
    const simpleConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/simple');
    expect(simpleConfig).toBeDefined();
    expect(simpleConfig?.class.name).toBe('SimpleComponent');
  });

  it('should manage basic plugin overriding configuration', () => {
    const test = dtcde.reset();

    test.registerPlugin(new BasicPluginTest());
    const entityConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'value1',
      });
    expect(entityConfig).toBeDefined();
    expect(entityConfig?.class.name).toBe('BasicComponent');

    // Now it should select ValuePluginTest as it provides narrower criteria
    test.registerPlugin(new ValuesPluginTest());
    const valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'value1',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('ValuesComponent');
  });

  it('should manage plugin configurations with values', () => {
    const test = dtcde.reset();

    test.registerPlugin(new ValuesPluginTest());
    let valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'value1',
      });
    expect(valuesConfig).toBeTruthy();
    expect(valuesConfig?.class.name).toBe('ValuesComponent');

    valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values/key', 'value1');
    expect(valuesConfig).toBeTruthy();
    expect(valuesConfig?.class.name).toBe('ValuesComponent');

    try {
      test.getPreviewManager().retrieveHandlerConfig('creation/values');
      expect(true).toBeFalsy();
    } catch (err) {
      // Throw an error if it cannot find a handler because it needs to decide based on a value
    }
  });

  it('should find the right plugin depending on values', () => {
    const test = dtcde.reset();

    test.registerPlugin(new ValuesPluginTest());
    test.registerPlugin(new OtherValuesPluginTest());
    let valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'value1',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('ValuesComponent');

    valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'othervalue2',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('OtherValuesComponent');
  });

  it('should manage mixed config with values or not', () => {
    const test = dtcde.reset();

    test.registerPlugin(new ValuesPluginTest());
    test.registerPlugin(new OtherValuesPluginTest());
    test.registerPlugin(new NoValuesPluginTest());

    let valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', null);
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('NoValuesComponent');

    valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'othervalue1',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('OtherValuesComponent');
  });

  it('should manage subtype of fields', () => {
    const test = dtcde.reset();

    test.registerPlugin(new ValuesPluginTest());
    test.registerPlugin(new SubTypeValuesPluginTest());
    let valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'group1Value2',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('SubTypeValuesComponent');

    valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'value1',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('ValuesComponent');

    valuesConfig = test
      .getPreviewManager()
      .retrieveHandlerConfig('creation/values', {
        key: 'group2Value1',
      });
    expect(valuesConfig).toBeDefined();
    expect(valuesConfig?.class.name).toBe('SubTypeValuesComponent');
  });

  it('should manage global handlers', (done) => {
    const test = dtcde.reset();

    test.registerPlugin(new GlobalHandlerPluginTest());
    const gHandlers = test.getPreviewManager().getGlobalHandlers();
    expect(gHandlers.size).toBe(2);
    expect(gHandlers.get('creation/sources')).toHaveLength(2);
    expect(gHandlers.get('creation/sources')![0]).toHaveProperty(
      'class.name',
      'GlobalTestHandler'
    );
    expect(gHandlers.get('creation/sources')![1]).toHaveProperty(
      'location.parent',
      'creation/sources'
    );
    expect(gHandlers.get('creation/entities')).toHaveLength(1);
    expect(gHandlers.get('creation/entities')![0]).toHaveProperty(
      'class.name',
      'GlobalTestHandler2'
    );
    let counter = 0;

    test
      .getPreviewManager()
      .receiveGlobalHandlers()
      .subscribe({
        next: (value) => {
          counter++;
          switch (counter) {
            case 1:
              expect(value.location.parent).toBe('creation/sources');
              break;
            case 2:
              expect(value.class.name).toBe('GlobalTestHandler2');
              break;
            case 3:
              expect(value.location.parent).toBe('creation/sources');
              done();
              break;
            default:
              done('Invalid number of global handlers found:' + counter);
              break;
          }
        },
        error: (err) => {
          done(err);
        },
      });
  });
});

class SimplePluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'ScreenPlugin',
        'display-name': 'Dont code simple test Plugin ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/simple',
            id: 'name',
          },
          class: {
            name: 'SimpleComponent',
            source: 'simple',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class BasicPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'BasicPlugin',
        'display-name': 'Dont code Basic  test Plugin ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/values',
            id: '',
          },
          class: {
            name: 'BasicComponent',
            source: 'basic',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class ValuesPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'ValuesPlugin',
        'display-name': 'Dont code test Plugin with values ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/values',
            id: 'key',
            values: ['value1', 'value2'],
          },
          class: {
            name: 'ValuesComponent',
            source: 'value',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class OtherValuesPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'OtherValuesPlugin',
        'display-name': 'Dont code test Plugin with other values ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/values',
            id: 'key',
            values: ['othervalue1', 'othervalue2'],
          },
          class: {
            name: 'OtherValuesComponent',
            source: 'othervalue',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class SubTypeValuesPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'SubTypeValuesPlugin',
        'display-name': 'Dont code test Plugin with subTypes ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/values',
            id: 'key',
            values: [
              {
                group1: {
                  enum: ['group1Value1', 'group1Value2'],
                },
                group2: {
                  enum: ['group2Value1', 'group2Value2'],
                },
              },
            ],
          },
          class: {
            name: 'SubTypeValuesComponent',
            source: 'subtypevalue',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class NoValuesPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'NoValuesPlugin',
        'display-name': 'Dont code test Plugin with no values ',
        version: '1.0.0',
      },
      'preview-handlers': [
        {
          location: {
            parent: 'creation/values',
            id: 'key',
          },
          class: {
            name: 'NoValuesComponent',
            source: 'novalue',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}

class GlobalHandlerPluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'GlobalHandlerPluginTest',
        'display-name': 'Testing Global Handlers ',
        version: '1.0.0',
      },
      'global-handlers': [
        {
          location: {
            parent: 'creation/sources',
            id: 'type',
          },
          class: {
            name: 'GlobalTestHandler',
            source: 'global-test-module',
          },
        },
        {
          location: {
            parent: 'creation/entities',
            id: 'name',
          },
          class: {
            name: 'GlobalTestHandler2',
            source: 'global-test-module',
          },
        },
        {
          location: {
            parent: 'creation/sources',
            id: 'type',
          },
          class: {
            name: 'GlobalTestHandler3',
            source: 'global-test-module',
          },
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    // Empty
  }
}
