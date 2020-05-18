import { DontCode } from "@dontcode/core";
import dtcde = DontCode.dtcde;
import {
  DontCodeSchemaArray,
  DontCodeSchemaEnum,
  DontCodeSchemaItem,
  DontCodeSchemaObject, DontCodeSchemaRef,
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
      }
    );
    expect(item).toBeDefined();
    expect(item.get('type')).toBeInstanceOf (DontCodeSchemaEnum);
    const appType:DontCodeSchemaEnum=item.get('type');
    expect(appType.isEnum()).toBeTruthy();
    expect(appType.length).toEqual(1);
    expect(item.get('name')).toBeInstanceOf (DontCodeSchemaValue);
    const appName:DontCodeSchemaValue=item.get('name');
    expect(appName.getType()).toEqual('string');
    expect(item.get('entities')).toBeInstanceOf (DontCodeSchemaArray);
    const appEntities:DontCodeSchemaArray=item.get('entities');
    expect(appEntities.isArray()).toBeTruthy();
    expect(appEntities.getItemsSchemaItem()).toBeInstanceOf(DontCodeSchemaRef);
    const entitiesRef:DontCodeSchemaRef = appEntities.getItemsSchemaItem() as DontCodeSchemaRef;
    expect(entitiesRef.getReference()).toBeDefined();

  });
});
