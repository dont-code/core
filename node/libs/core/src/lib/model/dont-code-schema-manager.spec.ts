import * as DontCode from "@dontcode/core";
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

  it('should calculate pointers correctly', () => {
    const mgr = dtcde.getSchemaManager();
    let pointer = mgr.generateSchemaPointer('creation/name');
    expect(pointer).toEqual({
      position:'creation/name',
      schemaPosition:'creation/name',
      containerPosition:'creation',
      containerSchemaPosition:'creation',
      key:'name',
      itemId:null
    });

    pointer = mgr.generateSchemaPointer('/');
    expect(pointer).toEqual({
      position:'/',
      schemaPosition:'/',
      containerPosition:undefined,
      containerSchemaPosition:undefined,
      key:null,
      itemId:null
    });

    pointer = mgr.generateSchemaPointer('creation/screens/aaaa/name');
    expect(pointer).toEqual({
      position:'creation/screens/aaaa/name',
      schemaPosition:'creation/screens/name',
      containerPosition:'creation/screens/aaaa',
      containerSchemaPosition:'creation/screens',
      key:'name',
      itemId:null
    });
    pointer = mgr.generateSchemaPointer('creation/screens/aaaa');
    expect(pointer).toEqual({
      position:'creation/screens/aaaa',
      schemaPosition:'creation/screens',
      containerPosition:'creation/screens',
      containerSchemaPosition:'creation',
      key:null,
      itemId:'aaaa'
    });
    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb/type');
    expect(pointer).toEqual({
      position:'creation/entities/aaaa/fields/aabb/type',
      schemaPosition:'creation/entities/fields/type',
      containerPosition:'creation/entities/aaaa/fields/aabb',
      containerSchemaPosition:'creation/entities/fields',
      key:'type',
      itemId:null
    });

    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb');
    expect(pointer).toEqual({
      position:'creation/entities/aaaa/fields/aabb',
      schemaPosition:'creation/entities/fields',
      containerPosition:'creation/entities/aaaa/fields',
      containerSchemaPosition:'creation/entities',
      key:null,
      itemId:'aabb'
    });
  });

  it('should locate items properly', () => {
    const mgr = dtcde.getSchemaManager();
    let root = mgr.locateItem('/');
    expect(root).toBeDefined();
    expect(root.getParent()).toBeUndefined();
    expect(root.isArray()).toBeFalsy();

    let name = mgr.locateItem('creation/entities/name');
    expect(name).toBeDefined();
    expect(name.isArray()).toBeFalsy();

    let fields = mgr.locateItem('creation/entities/fields');
    expect(fields).toBeDefined();
    expect(fields.isArray()).toBeTruthy();

    let type = mgr.locateItem('creation/entities/fields/type');
    expect(type).toBeDefined();
    expect(type.isArray()).toBeFalsy();
    expect(type.isEnum()).toBeTruthy();
  });

  it('should calculate the right key', () => {
    const mgr = dtcde.getSchemaManager();
    let pointer = mgr.generateSchemaPointer('creation/name');
    expect(pointer.calculateKeyOrContainer()).toEqual('name');

    pointer = mgr.generateSchemaPointer('creation/screens/aaaa');
    expect(pointer.calculateKeyOrContainer()).toEqual('screens');

    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb/type');
    expect(pointer.calculateKeyOrContainer()).toEqual('type');

    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb');
    expect(pointer.calculateKeyOrContainer()).toEqual('fields');

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
