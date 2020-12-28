import { DontCodeModel } from './dont-code-model';

export class DontCodeSchema {
  static ROOT= '/properties/'+DontCodeModel.ROOT;

  /**
   * This is a copy of dont-code-schema.json, please don't forget to update
   */
  static defaultv1={
    "$id": "http://dont-code.net/dont-code-schema/v1",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "description": "JSON Schema v1 for dont-code",
    "type": "object",
    "required": [
      "creation"
    ],
    "properties": {
      "creation": {
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
          },
          "screens": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/screen"
            }
          }
        },
        "additionalProperties": false
      }
    },
    "definitions": {
      "entity": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "fields": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/field"
            }
          }
        },
        "additionalProperties": false
      },
      "field": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "enum": [
              "string",
              "number",
              "boolean"
            ]
          }
        },
        "additionalProperties": false
      },
      "screen": {
        "type": "object",
        "properties": {
          "name": {
            "type":"string"
          },
          "layout": {
            "enum": [
              "flow",
              "grid"
            ]
          },
          "components": {
            "type": "array",
            "items": {
              "$ref": "#/definitions/component"
            }
          }
        },
        "additionalProperties": false
      },
      "component": {
        "type": "object",
        "properties": {
          "type": {
            "enum": [
              "list",
              "edit",
              "view"
            ]
          },
          "entity": {
            "type": "string",
            "format": "#/creation/entities"
          }
        },
        "additionalProperties": false
      }
    }
  };
}

/**
 * Store all information needed to point to a single element in a model.
 */
export class DontCodeModelPointer {
  position:string;

  schemaPosition:string;

  containerPosition: string;

  containerSchemaPosition: string;

  key: string;

  itemId: string;

  constructor(position: string, schemaPosition: string, containerPosition: string, containerSchemaPosition: string, key: string, itemId:string) {
    this.position = position;
    this.schemaPosition = schemaPosition;
    this.containerPosition = containerPosition;
    this.containerSchemaPosition = containerSchemaPosition;
    this.key = key;
    this.itemId = itemId;
  }

  /**
   * Find the name of the last element pointed by this pointer
   * Usually it's the value of key (if it's a field) or the last container name (if it's an element in a container like entity/a/fields/a)
   */
  calculateKeyOrContainer (): string {
    if (this.key) return this.key;
    else {
      return this.schemaPosition.substring(this.schemaPosition.lastIndexOf('/')+1);
    }
  }

}
