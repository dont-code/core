import * as DontCode from "@dontcode/core";
import dtcde = DontCode.dtcde;
import { DontCodeSchemaEnum, DontCodeSchemaObject, DontCodeSchemaRoot } from "./dont-code-schema-item";
import PluginConfig = DontCode.PluginConfig;
import {DontCodeSchemaEnumValue} from "@dontcode/core";

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
    expect(mgr.locateItem('/$defs/screen')).toBeDefined();
    const screen = mgr.locateItem('/$defs/screen') as DontCodeSchemaObject;
    expect(screen.getChild('type')).toBeDefined();
    const screenType = screen.getChild('type') as DontCodeSchemaEnum;
    expect(screenType.getValues().length).toEqual(2);
    expect(screenType.getValues()).toContainEqual (new DontCodeSchemaEnumValue('list'));
    expect(screenType.getValues()).toContainEqual (new DontCodeSchemaEnumValue('freeform'));
    expect(screenType.getProperties('list')).toBeDefined();
    const listProps =  screenType.getProperties('list');
    expect(listProps?.isEmpty()).toBeFalsy();
    expect(listProps?.isReplace()).toBeTruthy();
    expect(listProps?.getPosAfter()).toBeDefined();
    expect(listProps?.getChild('entity')).toBeDefined();

  });

  it('should manages rest plugin updates', () => {
    const mgr = dtcde.getSchemaManager();
    mgr.registerChanges(restPluginConfig);
    let sources = mgr.locateItem('/creation/sources');
    expect(sources).toBeDefined();
    expect(sources.isArray()).toBeTruthy();
    sources = mgr.locateItem('/creation/sources', true);
    expect(sources.isArray()).toBeFalsy();

    const sourceType = sources.getChild('type') as DontCodeSchemaEnum;
    expect(sourceType.getValues()).toContainEqual (new DontCodeSchemaEnumValue('Rest'));

    expect(sourceType.getProperties('Rest')).toBeDefined();
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
    const root = mgr.locateItem('/');
    expect(root).toBeDefined();
    expect(root.getParent()).toBeUndefined();
    expect(root.isArray()).toBeFalsy();

    const name = mgr.locateItem('creation/entities/name');
    expect(name).toBeDefined();
    expect(name.isArray()).toBeFalsy();

    const fields = mgr.locateItem('creation/entities/fields');
    expect(fields).toBeDefined();
    expect(fields.isArray()).toBeTruthy();

    const type = mgr.locateItem('creation/entities/fields/type');
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
            "parent": "#/$defs/screen",
            "id": "type",
            "after": "name"
          },
          "update": {
            "enum": [
              "list"
            ]
          },
          "props": {
            "entity": {
              "$ref": "#/$defs/entity",
              "format": "#/creation/entities"
            }
          },
          "replace": true
        }, {
          "location": {
            "parent": "/$defs/screen",
            "id": "type",
            "after": "name"
          },
          "update": {
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

const restPluginConfig = {
  plugin: {
    id: 'RestPlugin',
    'display-name': 'A plugin for entities managed through Rest APIs .',
    version: '1.0.0'
  },
  'schema-updates': [{
    id: 'rest-field',
    description: 'Create the list of sources',
    changes: [{
      location: {
        parent: '#/$defs/source',
        id: 'type'
      },
      update: {
        enum: [
          'Rest'
        ]
      },
      props: {
        url: {
          type: 'string'
        }
      },
      replace: false
    }]
  }]
};
