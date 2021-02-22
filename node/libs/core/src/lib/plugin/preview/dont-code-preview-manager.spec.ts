import { DontCodeCore } from "../../dontcode";
import * as DontCode from "../../globals";
import PluginConfig = DontCode.PluginConfig;

describe('Preview Manager', () => {
  it('should work', () => {
    const test = new DontCodeCore();
    expect(test).toBeDefined();
    expect(test.getPreviewManager()).toBeDefined();
  });

  it('should manage simple plugin configuration', () => {
    const test = new DontCodeCore();

    test.registerPlugin(new SimplePluginTest());
    const simpleConfig = test.getPreviewManager().retrieveHandlerConfig("creation/simple");
    expect (simpleConfig).toBeDefined();
    expect(simpleConfig.class.name).toBe("SimpleComponent");
  });

  it('should manage basic plugin overriding configuration', () => {
    const test = new DontCodeCore();

    test.registerPlugin(new BasicPluginTest());
    const entityConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values", {
      key:"value1"
    });
    expect (entityConfig).toBeDefined();
    expect(entityConfig.class.name).toBe("BasicComponent");

    // Now it should select ValuePluginTest as it provides narrower criteria
    test.registerPlugin(new ValuesPluginTest());
    const valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values", {
      key:"value1"
    });
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("ValuesComponent");
  });

  it('should manage plugin configurations with values', () => {
    const test = new DontCodeCore();

    test.registerPlugin(new ValuesPluginTest());
    const valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values",
    {
      key:"value1"
    });
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("ValuesComponent");

    const notFoundConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values");
    expect (notFoundConfig).toBeNull();
  });

  it('should find the right plugin depending on values', () => {
    const test = new DontCodeCore();

    test.registerPlugin(new ValuesPluginTest());
    test.registerPlugin(new OtherValuesPluginTest());
    let valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values",
    {
      key:"value1"
    });
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("ValuesComponent");

    valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values",
    {
      key:"othervalue2"
    });
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("OtherValuesComponent");

  });

  it('should manage mixed config with values or not', () => {
    const test = new DontCodeCore();

    test.registerPlugin(new ValuesPluginTest());
    test.registerPlugin(new OtherValuesPluginTest());
    test.registerPlugin(new NoValuesPluginTest());

    let valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values", null);
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("NoValuesComponent");

    valuesConfig = test.getPreviewManager().retrieveHandlerConfig("creation/values",
    {
      key:"othervalue1"
    });
    expect (valuesConfig).toBeDefined();
    expect(valuesConfig.class.name).toBe("OtherValuesComponent");

  });

});

class SimplePluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "ScreenPlugin",
        "display-name": "Dont code simple test Plugin ",
        "version": "1.0.0"
      },
      "preview-handlers": [
        {
          "location": {
            "parent": "creation/simple",
            "id": "name"
          },
          "class": {
            "name": "SimpleComponent",
            "source": "simple"
          }
        }
      ]

    }
  }
}

class BasicPluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "BasicPlugin",
        "display-name": "Dont code Basic  test Plugin ",
        "version": "1.0.0"
      },
      "preview-handlers": [
        {
          "location": {
            "parent": "creation/values"
          },
          "class": {
            "name": "BasicComponent",
            "source": "basic"
          }
        }
      ]

    }
  }
}

class ValuesPluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "ValuesPlugin",
        "display-name": "Dont code test Plugin with values ",
        "version": "1.0.0"
      },
      "preview-handlers": [
        {
          "location": {
            "parent": "creation/values",
            "id":"key",
            "values": [
              "value1",
              "value2"
            ]
          },
          "class": {
            "name":"ValuesComponent",
            "source":"value"
          }
        }
      ]

    }
  }

}

class OtherValuesPluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "OtherValuesPlugin",
        "display-name": "Dont code test Plugin with other values ",
        "version": "1.0.0"
      },
      "preview-handlers": [
        {
          "location": {
            "parent": "creation/values",
            "id":"key",
            "values":[
              "othervalue1",
              "othervalue2"
            ]
          },
          "class": {
            "name":"OtherValuesComponent",
            "source":"othervalue"
          }
        }
      ]

    }
  }

}
class NoValuesPluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "NoValuesPlugin",
        "display-name": "Dont code test Plugin with no values ",
        "version": "1.0.0"
      },
      "preview-handlers": [
        {
          "location": {
            "parent": "creation/values",
            "id":"key"
          },
          "class": {
            "name":"NoValuesComponent",
            "source":"novalue"
          }
        }
      ]

    }
  }

}

