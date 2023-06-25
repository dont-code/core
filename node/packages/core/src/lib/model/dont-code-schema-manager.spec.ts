import {DontCodeSchemaEnum, DontCodeSchemaObject, DontCodeSchemaRoot, DontCodeSchemaEnumValue} from './dont-code-schema-item';
import {PluginConfig, Plugin, Core, DontCodeReportType} from '../globals';
import {dtcde} from "../dontcode";

describe('Schema Manager', () => {
  it('should work', () => {
    const mgr = dtcde.getSchemaManager();
    expect(mgr).toBeDefined();
    expect(mgr.getSchema()).toBeInstanceOf(DontCodeSchemaRoot);
    expect(mgr.getSchema().getChild('creation')).toBeInstanceOf(
      DontCodeSchemaObject
    );
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
    expect(screenType.getValues()).toContainEqual(
      new DontCodeSchemaEnumValue('list')
    );
    expect(screenType.getValues()).toContainEqual(
      new DontCodeSchemaEnumValue('freeform')
    );
    expect(screenType.getProperties('list')).toBeDefined();
    const listProps = screenType.getProperties('list');
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
    expect(sourceType.getValues()).toContainEqual(
      new DontCodeSchemaEnumValue('Rest')
    );

    expect(sourceType.getProperties('Rest')).toBeDefined();
  });

  it('should calculate pointers correctly', () => {
    const mgr = dtcde.getSchemaManager();
    let pointer = mgr.generateSchemaPointer('creation/name');
    expect(pointer).toEqual({
      position: 'creation/name',
      positionInSchema: 'creation/name',
      containerPosition: 'creation',
      containerPositionInSchema: 'creation',
      lastElement: 'name',
      isProperty: true,
    });

    pointer = mgr.generateSchemaPointer('');
    expect(pointer).toEqual({
      position: '',
      positionInSchema: '',
      containerPosition: undefined,
      containerPositionInSchema: undefined,
      lastElement: '',
      isProperty: undefined,
    });

    pointer = mgr.generateSchemaPointer('creation/screens/aaaa/name');
    expect(pointer).toEqual({
      position: 'creation/screens/aaaa/name',
      positionInSchema: 'creation/screens/name',
      containerPosition: 'creation/screens/aaaa',
      containerPositionInSchema: 'creation/screens',
      lastElement: 'name',
      isProperty: true,
    });
    pointer = mgr.generateSchemaPointer('creation/screens/aaaa');
    expect(pointer).toEqual({
      position: 'creation/screens/aaaa',
      positionInSchema: 'creation/screens',
      containerPosition: 'creation/screens',
      containerPositionInSchema: 'creation',
      lastElement: 'aaaa',
      isProperty: false,
    });
    pointer = mgr.generateSchemaPointer(
      'creation/entities/aaaa/fields/aabb/type'
    );
    expect(pointer).toEqual({
      position: 'creation/entities/aaaa/fields/aabb/type',
      positionInSchema: 'creation/entities/fields/type',
      containerPosition: 'creation/entities/aaaa/fields/aabb',
      containerPositionInSchema: 'creation/entities/fields',
      lastElement: 'type',
      isProperty: true,
    });

    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb');
    expect(pointer).toEqual({
      position: 'creation/entities/aaaa/fields/aabb',
      positionInSchema: 'creation/entities/fields',
      containerPosition: 'creation/entities/aaaa/fields',
      containerPositionInSchema: 'creation/entities',
      lastElement: 'aabb',
      isProperty: false,
    });

    // Check the dynamic properties are correctly handled
    mgr.registerChanges(new PluginTest().getConfiguration());
    pointer = mgr.generateSchemaPointer('creation/screens/a/entity');
    expect(pointer).toEqual({
      position: 'creation/screens/a/entity',
      positionInSchema: 'creation/screens/entity',
      containerPosition: 'creation/screens/a',
      containerPositionInSchema: 'creation/screens',
      lastElement: 'entity',
      isProperty: true,
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

    // Should raed the format field
    const from = mgr.locateItem('creation/entities/from');
    expect(from).toBeDefined();
    expect(from.isArray()).toBeFalsy();
    expect(from.getTargetPath()).toBeDefined();
  });

  it('should calculate the right key', () => {
    const mgr = dtcde.getSchemaManager();
    let pointer = mgr.generateSchemaPointer('creation/name');
    expect(pointer.calculateKeyOrContainer()).toEqual('name');

    pointer = mgr.generateSchemaPointer('creation/screens/aaaa');
    expect(pointer.calculateKeyOrContainer()).toEqual('screens');

    pointer = mgr.generateSchemaPointer(
      'creation/entities/aaaa/fields/aabb/type'
    );
    expect(pointer.calculateKeyOrContainer()).toEqual('type');

    pointer = mgr.generateSchemaPointer('creation/entities/aaaa/fields/aabb');
    expect(pointer.calculateKeyOrContainer()).toEqual('fields');
  });
});

it('should define correctly report definitions', () => {
  const reportSample={
        "title": "Table Reports",
        "for": "Basic Entity",
        "groupedBy": {
          "a":{
            "label": "By Type",
            "of": "Type",
            "display": {
              "aa": {
                "operation": "Count",
                "of": "Value",
                "label": "Elements #"
              },
              "ab":
                {
                  "operation": "Minimum",
                  "of": "Amount",
                  "label": "Min cost"
                }
            }
          }
        },
        "as": {
          "b":{
            "type": "Table",
            "of":"value",
            "title": "Infos"
          }
        }
      };

    // Compile time verification
  const asReport = reportSample as DontCodeReportType;

});


class PluginTest implements Plugin {
  getConfiguration(): PluginConfig {
    return {
      plugin: {
        id: 'ScreenPlugin',
        'display-name': 'Dont code test Plugin adding screen types',
        version: '1.0.0',
      },
      'schema-updates': [
        {
          id: 'screen-list',
          description: 'A screen displaying a list of items',
          changes: [
            {
              location: {
                parent: '#/$defs/screen',
                id: 'type',
                after: 'name',
              },
              update: {
                enum: ['list'],
              },
              props: {
                entity: {
                  $ref: '#/$defs/entity',
                  format: '#/creation/entities',
                },
              },
              replace: true,
            },
            {
              location: {
                parent: '/$defs/screen',
                id: 'type',
                after: 'name',
              },
              update: {
                enum: ['freeform'],
              },
              props: {},
              replace: false,
            },
          ],
        },
      ],
    };
  }

  pluginInit(dontCode: Core): void {
    throw new Error('Method not implemented.');
  }
}

const restPluginConfig = {
  plugin: {
    id: 'RestPlugin',
    'display-name': 'A plugin for entities managed through Rest APIs .',
    version: '1.0.0',
  },
  'schema-updates': [
    {
      id: 'rest-field',
      description: 'Create the list of sources',
      changes: [
        {
          location: {
            parent: '#/$defs/source',
            id: 'type',
          },
          update: {
            enum: ['Rest'],
          },
          props: {
            url: {
              type: 'string',
            },
          },
          replace: false,
        },
      ],
    },
  ],
};
