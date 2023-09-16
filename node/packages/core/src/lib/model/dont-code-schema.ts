import { DontCodeModel } from './dont-code-model';
import { DontCodeSchemaManager } from './dont-code-schema-manager';

export class DontCodeSchema {
  static ROOT = '/properties/' + DontCodeModel.ROOT;

  /**
   * This is a copy of dont-code-schema.json, please don't forget to update
   */
  static defaultv1 = {
    "$id": "https://dont-code.net/v1/dont-code-schema.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "description": "JSON Schema v1 for dont-code",
    "type": "object",
    "required": ["creation"],
    "properties": {
      "creation": {
        "type": "object",
        "properties": {
          "type": {
            "enum": ["Application"]
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
          "reports": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/report"
            }
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
            "type": "string",
            "format": "$.creation.sources.name"
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
                  "enum": ["Date", "Date & Time", "Time"]
                }
              },
              {
                "Money": {
                  "enum": ["Dollar", "Euro", "Other currency"]
                },
                "Web": {
                  "enum": ["Website (url)", "Image"]
                }
              }, {
                "Special": {
                  "enum": ["Reference"]
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
            "enum": ["No-one"]
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
            "enum": ["Unknown"]
          }
        }
      },
      "report": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "for": {
            "type": "string",
            "format": "$.creation.entities.name"
          },
          "groupedBy": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/report-group"
            }
          },
          "sortedBy": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/report-sort"
            }
          },
          "as": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/report-display"
            }
          }
        },
        "additionalProperties": false
      },
      "report-group": {
        "type": "object",
        "properties": {
          "of": {
            "type": "string",
            "format": ".fields.name"
          },
          "label": {
            "type": "string"
          },
          "show": {
            "enum": ["OnlyLowest", "OnlyHighest"]
          },
          "display": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/report-group-aggregate"
            }
          }
        },
        "additionalProperties": false
      },
      "report-group-aggregate": {
        "type": "object",
        "properties": {
          "operation": {
            "enum": ["Count", "Sum", "Average", "Minimum", "Maximum"]
          },
          "of": {
            "type": "string",
            "format": ".@parent.fields.name"
          },
          "label": {
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "report-sort": {
        "type": "object",
        "properties": {
          "by": {
            "type": "string",
            "format": ".fields.name"
          },
          "direction": {
            "enum": ["None", "Ascending", "Descending"]
          }
        },
        "additionalProperties": false
      },
      "report-display": {
        "type": "object",
        "properties": {
          "type": {
            "enum": ["Table", "Bar", "Line", "Pie"]
          },
          "of": {
            "type": "string",
            "format": ".@parent.fields.name"
          },
          "by": {
            "type": "string",
            "format": ".@parent.fields.name"
          },
          "title": {
            "type": "string"
          }
        },
        "additionalProperties": false
      },

      "screen": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "layout": {
            "enum": ["Flow", "Grid"]
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
            "enum": ["List", "Edit", "View"]
          },
          "entity": {
            "type": "string",
            "format": "$.creation.entities.name"
          }
        },
        "additionalProperties": false
      }
    }
  }
}

  /**
 * Store all information needed to point to a single element in a model.
 */
  export class DontCodeModelPointer {
  position: string;

  positionInSchema: string;

  containerPosition?: string; // undefined as root does not have container...
  containerPositionInSchema?: string; // undefined as root does not have container...

  lastElement: string;
  isProperty?: boolean;

  constructor(
    position: string,
    schemaPosition: string,
    containerPosition?: string,
    containerSchemaPosition?: string,
    lastElement?: string,
    isProperty?: boolean
  ) {
    this.position = position;
    this.positionInSchema = schemaPosition;
    this.containerPosition = containerPosition;
    this.containerPositionInSchema = containerSchemaPosition;
    if (lastElement) this.lastElement = lastElement;
    else this.lastElement = '';
    this.isProperty = isProperty;
    this.fillMissingElements();
  }

  fillMissingElements(optionalSchemaMgr?: DontCodeSchemaManager): void {
    if (this.position == null || this.positionInSchema == null) {
      throw new Error('Cannot fill Elements for an empty position');
    }

    if (this.containerPosition == null) {
      this.containerPosition =
        DontCodeModelPointer.parentPosition(this.position) ?? undefined;
    }
    if (this.containerPositionInSchema == null) {
      this.containerPositionInSchema =
        DontCodeModelPointer.parentPosition(this.positionInSchema) ?? undefined;
    }
    if (this.lastElement == null || this.lastElement.length == 0) {
      this.lastElement =
        DontCodeModelPointer.lastElementOf(this.position) ?? this.position;
    }

    if (this.isProperty == null && optionalSchemaMgr) {
      if (this.containerPositionInSchema)
        this.isProperty =
          optionalSchemaMgr
            .locateItem(this.containerPositionInSchema, true)
            .getChild(this.lastElement) != null;
      else this.isProperty = true; // We only have properties at root level
    }
  }

  /**
   * Finds the last element of this position
   * @param position
   */
  public static lastElementOf(position?: string): string | undefined {
    if (position == null) return position;
    return position.substring(position.lastIndexOf('/') + 1);
  }

  /**
   * Finds the next item in the position and returns its value and position in the string
   * @param position
   * @param from
   */
  public static nextItemAndPosition(
    position: string,
    from: number
  ): { pos: number; value: string | null } {
    let posSlash = position.indexOf('/', from);
    if (posSlash === from) {
      from = from + 1;
      posSlash = position.indexOf('/', from);
    }
    if (posSlash !== -1) posSlash = posSlash - 1;
    else {
      if (posSlash === from) {
        posSlash = -1;
      } else {
        posSlash = position.length - 1;
      }
    }

    let value = null;
    if (posSlash !== -1) value = position.substring(from, posSlash + 1);

    return {
      pos: posSlash,
      value: value,
    };
  }

  /**
   * Find the name of the last element pointed by this pointer
   * Usually it's the value of key (if it's a field) or the last container name (if it's an element in a container like entity/a/fields/a)
   * @deprecated
   */

  calculateKeyOrContainer(): string {
    if (this.isProperty === true) {
      return this.lastElement;
    } else {
      return DontCodeModelPointer.lastElementOf(this.containerPosition) ?? '';
    }
  }

  /**
   * Find the ItemId or container key represented by the pointer
   * Usually it's the id of the item (if it's an element in a container like entity/a/fields/a) or the last container name
   * @Deprecated
   */
  calculateItemIdOrContainer(): string | undefined {
    if (this.isProperty === false) {
      return this.lastElement;
    } else {
      return DontCodeModelPointer.lastElementOf(this.containerPosition) ?? '';
    }
  }

  /**
   * If this pointer is pointing to a direct property of the given pointer, then it returns the property's name, otherwise null
   * @param pointer
   * @return the property name or null
   */
  isSubItemOf(pointer: DontCodeModelPointer): string | null {
    if (pointer.position === this.containerPosition) {
      return this.lastElement;
    } else return null;
  }

  /**
   * Returns the direct property's name under which this pointer points to, even if it's pointing to sub properties of the direct property.
   * @param pointer
   * @return the property name or null
   */
  isUnderSubItemOf(pointer: DontCodeModelPointer): string | null {
    if (this.positionInSchema.startsWith(pointer.positionInSchema)) {
      const keyPos = this.positionInSchema.indexOf(
        '/',
        pointer.positionInSchema.length + 1
      );
      if (keyPos == -1)
        return this.positionInSchema.substring(
          pointer.positionInSchema.length + 1
        );
      else
        return this.positionInSchema.substring(
          pointer.positionInSchema.length + 1,
          keyPos
        );
    } else return null;
  }

  /**
   * Returns a pointer pointing to a sub Item of the current pointer.
   * The current pointer must point to an array
   * @param subItem
   */
  subItemOrPropertyPointer(
    subElement: string,
    isItem: boolean
  ): DontCodeModelPointer {
    if (isItem) return this.subPropertyPointer(subElement);
    else return this.subItemPointer(subElement);
  }

  /**
   * Returns a pointer pointing to a sub property of the current pointer
   * @param subProp
   */
  subPropertyPointer(subProp: string): DontCodeModelPointer {
    const newPointer = new DontCodeModelPointer(
      this.position === '' ? subProp : this.position + '/' + subProp,
      this.positionInSchema === ''
        ? subProp
        : this.positionInSchema + '/' + subProp,
      this.position,
      this.positionInSchema,
      subProp,
      true
    );
    return newPointer;
  }

  /**
   * Returns a pointer pointing to a sub Item of the current pointer.
   * The current pointer must point to an array
   * @param subItem
   */
  subItemPointer(subItem: string): DontCodeModelPointer {
    const newPointer = new DontCodeModelPointer(
      this.position === '' ? subItem : this.position + '/' + subItem,
      this.positionInSchema,
      this.position,
      this.containerPositionInSchema,
      subItem,
      false
    );
    return newPointer;
  }

    /**
     * Returns the parent pointer or an exception if it's the root
     * @param subItem
     */
    safeParentPointer(optionalSchemaMgr?: DontCodeSchemaManager): DontCodeModelPointer {
      const ret = this.parentPointer(optionalSchemaMgr);
      if( ret===undefined)
        throw new Error("No parent position for pointer "+this.position);
      return ret;
    }

    /**
     * Returns the parent pointer or undefined if it's the root
     * @param subItem
     */
    parentPointer(optionalSchemaMgr?: DontCodeSchemaManager): DontCodeModelPointer|undefined {
      if( (this.containerPosition==null) || (this.containerPositionInSchema==null))
        return undefined;
      const newPointer = new DontCodeModelPointer(
        this.containerPosition,
        this.containerPositionInSchema
      );
      if( optionalSchemaMgr!=null) {
        newPointer.fillMissingElements(optionalSchemaMgr);
      }
      return newPointer;
    }

    /**
     * Returns true if the pointer is the parent of the position.
     * @param position
     * @param directOnly: if true, only returns true if it's a direct parent
     */
    public isParentOf (position:string, directOnly?:boolean): boolean {
      if (directOnly===true) {
        const parent=DontCodeModelPointer.parentPosition(position);
        if( parent==null) {
          return false;
        } else {
          return this.position == parent;
        }
      }else {
        return position.startsWith(this.position);
      }
    }

    /**
   * Safely returns the parent position
   * @param position
   */
  public static parentPosition(position?: string): string | null {
    if (position == null || position.length === 0) return null;
    const lastSlash = position.lastIndexOf('/');
    if (lastSlash == -1) return '';
    else {
      return position.substring(0, lastSlash);
    }
  }


  /**
   * Safely splits between the parent position and last element
   * @param position
   */
  public static splitPosition(
    position?: string
  ): { parent: string; element: string } | null {
    if (position == null || position.length === 0) return null;
    const lastSlash = position.lastIndexOf('/');
    if (lastSlash == -1)
      return {
        parent: '',
        element: position,
      };
    else {
      return {
        parent: position.substring(0, lastSlash),
        element: position.substring(lastSlash + 1),
      };
    }
  }
}
