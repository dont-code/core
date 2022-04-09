import {
  AbstractSchemaItem,
  DontCodeSchemaEnum,
  DontCodeSchemaEnumValue,
  DontCodeSchemaObject,
  DontCodeSchemaRef,
  DontCodeSchemaValue,
} from './dont-code-schema-item';

describe('Schema Item', () => {
  it('should read simple object', () => {
    const item = new DontCodeSchemaObject(
      {
        type: 'object',
        properties: {
          type: {
            enum: ['application'],
          },
          name: {
            type: 'string',
          },
          entities: {
            type: 'array',
            items: {
              $ref: '#/definitions/entity',
            },
          },
        },
      },
      'root'
    );
    expect(item).toBeDefined();
    expect(item.getChild('type')).toBeInstanceOf(DontCodeSchemaEnum);
    const appType = item.getChild('type') as DontCodeSchemaEnum;
    expect(appType.isEnum()).toBeTruthy();
    expect(appType.getValues().length).toEqual(1);
    expect(item.getChild('name')).toBeInstanceOf(DontCodeSchemaValue);
    const appName = item.getChild('name') as DontCodeSchemaValue;
    expect(appName.getType()).toEqual('string');
    expect(item.getChild('entities')).toBeInstanceOf(DontCodeSchemaRef);
    const appEntities = item.getChild('entities') as DontCodeSchemaRef;
    expect(appEntities.isArray()).toBeTruthy();
    expect(appEntities.getReference()).toBeDefined();
  });

  it('should read and update enum', () => {
    const item = new DontCodeSchemaEnum(
      {
        enum: ['value1', 'value2'],
      },
      'root'
    );
    expect(item).toBeDefined();
    expect(item.getValues()).toEqual([
      new DontCodeSchemaEnumValue('value1'),
      new DontCodeSchemaEnumValue('value2'),
    ]);

    item.updateWith({
      location: {
        parent: '',
        id: '',
      },
      update: {
        enum: ['value3', 'value4'],
      },
    });
    expect(item.getValues()).toEqual([
      new DontCodeSchemaEnumValue('value1'),
      new DontCodeSchemaEnumValue('value2'),
      new DontCodeSchemaEnumValue('value3'),
      new DontCodeSchemaEnumValue('value4'),
    ]);

    item.updateWith({
      location: {
        parent: '',
        id: '',
      },
      update: {
        enum: ['value5'],
      },
      props: {
        entity: {
          type: 'string',
          format: '#/creation/entities',
        },
      },
      replace: true,
    });
    expect(item.getValues()).toEqual([
      new DontCodeSchemaEnumValue('value1'),
      new DontCodeSchemaEnumValue('value2'),
      new DontCodeSchemaEnumValue('value3'),
      new DontCodeSchemaEnumValue('value4'),
      new DontCodeSchemaEnumValue('value5'),
    ]);

    expect(item.getProperties('value3')).toBeFalsy();
    expect(item.getProperties('value5')).toBeTruthy();
  });

  it('should read enum hierarchy', () => {
    const item = new DontCodeSchemaEnum(
      {
        enum: [
          'Text',
          'Number',
          'Boolean',
          {
            Money: {
              enum: ['Dollars', 'Euros', 'Other'],
            },
          },
        ],
      },
      'root'
    );
    expect(item).toBeDefined();
    expect(item.getValues()).toHaveLength(4);
    const moneyValue = item.getValues()[3];
    expect(moneyValue.getValue()).toEqual('Money');
    expect(moneyValue.getChildren()).toEqual([
      new DontCodeSchemaEnumValue('Dollars'),
      new DontCodeSchemaEnumValue('Euros'),
      new DontCodeSchemaEnumValue('Other'),
    ]);

    item.updateWith({
      location: {
        parent: '',
        id: '',
      },
      update: {
        enum: [
          {
            Web: {
              enum: ['Website (url)', 'Image'],
            },
          },
        ],
      },
      props: {
        entity: {
          type: 'string',
          format: '#/creation/entities',
        },
      },
      replace: false,
    });

    const webValue = item.getValues()[4];
    expect(webValue.getValue()).toEqual('Web');
    expect(webValue.getChildren()).toEqual([
      new DontCodeSchemaEnumValue('Website (url)'),
      new DontCodeSchemaEnumValue('Image'),
    ]);
    expect(item.getProperties('Image')).toBeTruthy();
  });

  it('should support hidden and readOnly', () => {
    const item = AbstractSchemaItem.generateItem(
      {
        type: 'object',
        readOnly: true,
        writeOnly: true,
        properties: {
          type: {
            readOnly: true,
            writeOnly: true,
            enum: ['application'],
          },
          name: {
            type: 'string',
          },
          entities: {
            readOnly: true,
            writeOnly: true,
            type: 'array',
            items: {
              $ref: '#/definitions/entity',
            },
          },
        },
      },
      'root'
    );
    expect(item.isReadonly()).toBeTruthy();
    expect(item.isHidden()).toBeTruthy();
    const appType = item.getChild('type') as DontCodeSchemaEnum;
    expect(appType.isReadonly()).toBeTruthy();
    expect(appType.isHidden()).toBeTruthy();
    const appName = item.getChild('name') as DontCodeSchemaValue;
    expect(appName.isReadonly()).toBeFalsy();
    expect(appName.isHidden()).toBeFalsy();
    const appEntities = item.getChild('entities') as DontCodeSchemaRef;
    expect(appEntities.isReadonly()).toBeTruthy();
    expect(appEntities.isHidden()).toBeTruthy();
  });
});
