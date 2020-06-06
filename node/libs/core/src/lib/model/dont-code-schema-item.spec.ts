import {
  DontCodeSchemaEnum,
  DontCodeSchemaObject,
  DontCodeSchemaRef,
  DontCodeSchemaValue
} from "./dont-code-schema-item";

describe('Schema Item', () => {

  it('should read simple object', () => {
    const item = new DontCodeSchemaObject({
        "type": "object",
        "properties": {
          "type": {
            "enum": [
              "application"
            ]
          },
          "name": {
            "type": "string"
          },
          "entities": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/entity"
            }
          }
        }
      }, 'root'
    );
    expect(item).toBeDefined();
    expect(item.getChild('type')).toBeInstanceOf (DontCodeSchemaEnum);
    const appType=item.getChild('type') as DontCodeSchemaEnum;
    expect(appType.isEnum()).toBeTruthy();
    expect(appType.getValues().length).toEqual(1);
    expect(item.getChild('name')).toBeInstanceOf (DontCodeSchemaValue);
    const appName=item.getChild('name') as DontCodeSchemaValue;
    expect(appName.getType()).toEqual('string');
    expect(item.getChild('entities')).toBeInstanceOf (DontCodeSchemaRef);
    const appEntities=item.getChild('entities') as DontCodeSchemaRef;
    expect(appEntities.isArray()).toBeTruthy();
    expect(appEntities.getReference()).toBeDefined();

  });
});
