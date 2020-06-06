import { DontCode } from "@dontcode/core";
import dtcde = DontCode.dtcde;
import { DontCodeSchemaEnum, DontCodeSchemaObject, DontCodeSchemaRoot } from "./dont-code-schema-item";
import PluginConfig = DontCode.PluginConfig;

describe('Schema Manager', () => {
  it('should work', () => {
    const mgr = dtcde.getSchemaManager();
    expect(mgr).toBeDefined();
    expect(mgr.getSchema()).toBeInstanceOf(DontCodeSchemaRoot);
    expect(mgr.getSchema().getChild('creation')).toBeInstanceOf(DontCodeSchemaObject);
  });

  it('should updates model from plugin', () => {
    const mgr = dtcde.getSchemaManager();
    const plugin = new PluginTest();
    mgr.registerChanges(plugin.getConfiguration());
    expect(mgr.locateItem('/definitions/screen')).toBeDefined();
    const screen = mgr.locateItem('/definitions/screen') as DontCodeSchemaObject;
    expect(screen.getChild('type')).toBeDefined();
    const screenType = screen.getChild('type') as DontCodeSchemaEnum;
    expect(screenType.getValues().length).toEqual(2);
    expect(screenType.getValues()).toContain ('list');
    expect(screenType.getValues()).toContain ('freeform');
    expect(screenType.getProperties('list')).toBeDefined();
    const listProps =  screenType.getProperties('list');
    expect(listProps.isEmpty()).toBeFalsy();
    expect(listProps.isReplace()).toBeTruthy();
    expect(listProps.getPosAfter()).toBeDefined();
    expect(listProps.getChild('entity')).toBeDefined();

  });
});

class PluginTest implements DontCode.Plugin {
  getConfiguration(): PluginConfig {
    return {
      "plugin": {
        "id": "ScreenPlugin",
        "display-name": "Dont code test Plugin adding screen types",
        "version": "1.0.0"
      },
      "schema-updates": [{
        "id": "screen-list",
        "description": "A screen displaying a list of items",
        "changes": [{
          "location": {
            "parent": "#/definitions/screen",
            "id": "type",
            "after": "name"
          },
          "add": {
            "enum": [
              "list"
            ]
          },
          "props": {
            "entity": {
              "$ref": "#/definitions/entity",
              "format": "#/creation/entities"
            }
          },
          "replace": true
        }, {
          "location": {
            "parent": "/definitions/screen",
            "id": "type",
            "after": "name"
          },
          "add": {
            "enum": [
              "freeform"
            ]
          },
          "props": {},
          "replace": false
        }]
      }]
    }
  }
}
