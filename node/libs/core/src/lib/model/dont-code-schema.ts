import { DontCodeModel } from './dont-code-model';

export class DontCodeSchema {
  static ROOT= '/properties/'+DontCodeModel.ROOT;

  /**
   * This is a copy of dont-code-schema.json, please don't forget to update
   */
  static defaultv1={
    "$id": "https://dont-code.net/dont-code-schema/v1",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
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
              "Application"
            ]
          },
          "name": {
            "type": "string"
          },
          "entities": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/entity"
            }
          },
          "sharing": {
            "$ref": "#/$defs/sharing"
          },
          "sources": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/source"
            }
          },
          "screens": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/screen"
            }
          }
        },
        "additionalProperties": false
      }
    },
    "$defs": {
      "entity": {
        "type": "object",
        "properties": {
          "from": {
            type: 'string',
            format: '$.creation.sources.name'
          },
          "name": {
            "type": "string"
          },
          "fields": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/field"
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
              "Text",
              "Number",
              "Boolean",
              {
                "Time": {
                  "enum": [
                    "Date",
                    "Date & Time",
                    "Time"
                  ]
                }
              },
              {
                "Money": {
                  "enum": [
                    "Dollar",
                    "Euro",
                    "Other currency"
                  ]
                },
                "Web": {
                  "enum": [
                    "Website (url)",
                    "Image"
                  ]
                }
              }
            ]
          }
        },
        "additionalProperties": false
      },
      "sharing": {
        "type": "object",
        "properties": {
          "with": {
            "enum": [
              "No-one"
            ]
          }
        },
        "additionalProperties": false
      },
      "source": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "type": {
            "enum": [
              "Unknown"
            ]
          }
        }},
      "screen": {
        "type": "object",
        "properties": {
          "name": {
            "type":"string"
          },
          "layout": {
            "enum": [
              "Flow",
              "Grid"
            ]
          },
          "components": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/component"
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
              "List",
              "Edit",
              "View"
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

  containerPosition: string|undefined;  // undefined as root does not have container...

  containerSchemaPosition: string|undefined;  // undefined as root does not have container...

  key: string|null;

  itemId: string|null;

  constructor(position: string, schemaPosition: string, containerPosition: string|undefined, containerSchemaPosition: string|undefined, key: string|null, itemId:string|null) {
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

  /**
   * Find the ItemId or container key represented by the pointer
   * Usually it's the id of the item (if it's an element in a container like entity/a/fields/a) or the last container name
   */
  calculateItemIdOrContainer (): string|undefined {
    if (this.itemId) return this.itemId;
    else {
      return this.containerPosition?.substring(this.containerPosition?.lastIndexOf('/')+1);
    }
  }

  /**
   * If this pointer is pointing to a direct property of the given pointer, then it returns the property's name, otherwise null
   * @param pointer
   * @return the property name or null
   */
  isPropertyOf (pointer:DontCodeModelPointer): string|null {
    if (pointer.position===this.containerPosition) {
      return this.calculateKeyOrContainer();
    }else return null;
  }

  /**
   * Returns the direct property's name under which this pointer points to, even if it's pointing to sub properties of the direct property.
   * @param pointer
   * @return the property name or null
   */
  getUnderPropertyOf (pointer:DontCodeModelPointer): string|null {
    if (this.schemaPosition.startsWith(pointer.schemaPosition)) {
      const keyPos=this.schemaPosition.indexOf('/', pointer.schemaPosition.length+1);
      if( keyPos == -1)
        return this.schemaPosition.substring(pointer.schemaPosition.length+1);
      else
        return this.schemaPosition.substring(pointer.schemaPosition.length+1, keyPos);
    }
    else return null;
  }

  /**
   * Returns a pointer pointing to a sub Item of the current pointer.
   * The current pointer must point to an array
   * @param subItem
   */
  subItemOrPropertyPointer (subElement:string, isItem:boolean): DontCodeModelPointer {
    if (isItem) return this.subPropertyPointer(subElement);
    else return this.subItemPointer(subElement);
  }

    /**
   * Returns a pointer pointing to a sub property of the current pointer
   * @param subProp
   */
  subPropertyPointer (subProp:string): DontCodeModelPointer {
    const newPointer = new DontCodeModelPointer(
      (this.position==='/' || this.position==='')?subProp:this.position+'/'+subProp,
      (this.schemaPosition==='/' || this.schemaPosition==='')?subProp:this.schemaPosition+'/'+subProp,
      this.position,
      this.schemaPosition,
      subProp,
      null
    );
    return newPointer;
  }


  /**
   * Returns a pointer pointing to a sub Item of the current pointer.
   * The current pointer must point to an array
   * @param subItem
   */
  subItemPointer (subItem:string): DontCodeModelPointer {
    const newPointer = new DontCodeModelPointer(
      (this.position==='/')?subItem:this.position+'/'+subItem,
      this.schemaPosition,
      this.position,
      this.containerSchemaPosition,
      null,
      subItem
    );
    return newPointer;
  }
}
