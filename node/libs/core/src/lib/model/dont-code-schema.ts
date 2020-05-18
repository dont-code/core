import { DontCodeModel } from './dont-code-model';

export class DontCodeSchema {
  static ROOT= '/properties/'+DontCodeModel.ROOT;

  static default={
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
            "$ref": "#/definitions/entity",
            "format": "#/creation/entities"
          }
        },
        "additionalProperties": false
      }
    }
  };

}
