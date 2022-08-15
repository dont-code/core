import {Change, ChangeType} from '../change/change';
import {DontCodeSchemaItem} from './dont-code-schema-item';
import {DontCodeSchemaManager} from './dont-code-schema-manager';
import {JSONPath} from 'jsonpath-plus';
import {DontCodeModelPointer} from './dont-code-schema';
import {DefinitionUpdateConfig} from "../globals";

/**
 * Stores and constantly updates the json (as an instance of the DontCodeSchema) as it is being edited / modified through Change events
 * It does not store the entity values but the description of entities, screens... as defined in the Editor
 */
export class DontCodeModelManager {
  protected content: any;

  static readonly POSSIBLE_CHARS_FOR_ARRAY_KEYS="abcdefghijklmnopqrstuvxyz";
  static readonly POSSIBLE_CHARS_FOR_ARRAY_KEYS_LENGTH=DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS.length;

  constructor(protected schemaMgr: DontCodeSchemaManager) {}

  /**
   * Returns the complete json stored
   */
  getContent(): any {
    return this.content;
  }

  /**
   * Resets the current json content to the one given in parameter
   * @param newContent
   */
  resetContent(newContent: any) {
    this.content = newContent;
  }

  /**
   * Checks if the element can be viewed in the Builder or not
   * @param content
   */
  static isHidden(content: any): boolean {
    return content?.$hidden == true;
  }

  /**
   * Checks if the element can be edited in the Builder or not
   * @param content
   */
  static isReadonly(content: any): boolean {
    return content?.$readOnly == true;
  }

  /**
   * Apply the change to the current model and split it into multiple atomic changes for each modified property
   * @param toApply
   */
  applyChange(toApply: Change): Array<Change> {
    let pointer =
      toApply.pointer ?? this.schemaMgr.generateSchemaPointer(toApply.position);
    toApply.pointer = pointer;
    const parentPosition = pointer.containerPosition;
    const subElem = toApply.pointer?.lastElement;
    if (parentPosition != null && subElem != null)
      pointer = this.schemaMgr.generateParentPointer(pointer)!;

    const atomicChanges = new AtomicChange();
    atomicChanges.isRoot = true;
    atomicChanges.name = pointer.position;
    let lastChange = atomicChanges;
    let content = this.findAtPosition(pointer.position);

    if (content == null) {
      // Are we trying to delete a non existing content ?
      if (toApply.type === ChangeType.DELETE) {
        return []; // Nothing has changed
      } else {
        // we are adding something, so create the parent
        content = this.findAtPosition(pointer.position, true, atomicChanges);
        let basePosition = pointer.position;
        while (lastChange.subChanges.length > 0) {
          basePosition = basePosition.substring(
            0,
            basePosition.lastIndexOf('/')
          );
          lastChange = lastChange.subChanges[0];
        }
        atomicChanges.name = basePosition;
      }
    }

    this.applyChangeRecursive(
      toApply,
      content,
      toApply.value,
      toApply.pointer,
      lastChange
    );
    return this.generateChanges(
      toApply,
      atomicChanges,
      this.schemaMgr.generateSchemaPointer(atomicChanges.name)
    );
  }

  protected applyChangeRecursive(
    srcChange: Change,
    oldContent: any,
    newContent: any,
    pointer: DontCodeModelPointer,
    atomicChanges: AtomicChange,
    oldPosition?: string
  ): void {
    if (srcChange.pointer == null)
      throw new Error(
        'Cannot apply a change without a pointer at position ' +
          srcChange.position
      );

    if (oldPosition == null) oldPosition = srcChange.oldPosition;

    const subElem = pointer.lastElement;
    if (subElem || subElem.length === 0) {
      //const subPointer = pointer.subItemOrPropertyPointer(subElem, pointer?.key==null);
      const oldSubContent =
        subElem.length === 0 ? oldContent : oldContent[subElem];
      switch (srcChange.type) {
        case ChangeType.ADD:
        case ChangeType.UPDATE:
        case ChangeType.RESET:
          {
            let curAtomicChange;
            if (
              srcChange.type === ChangeType.RESET &&
              srcChange.position === pointer.position
            ) {
              // Create a RESET change for the root element reset only
              if (
                typeof newContent === 'object' &&
                this.isTheSameForParent(oldSubContent, newContent)
              ) {
                curAtomicChange = atomicChanges.createSubChange(
                  undefined,
                  subElem,
                  null
                );
              } else if (
                typeof newContent === 'object' ||
                oldSubContent !== newContent
              ) {
                curAtomicChange = atomicChanges.createSubChange(
                  ChangeType.RESET,
                  subElem,
                  newContent
                );
              }
            } else if (oldSubContent == null) {
              curAtomicChange = atomicChanges.createSubChange(
                ChangeType.ADD,
                subElem,
                newContent
              );
            } else if (
              typeof newContent === 'object' &&
              this.isTheSameForParent(oldSubContent, newContent)
            ) {
              curAtomicChange = atomicChanges.createSubChange(
                undefined,
                subElem,
                null
              );
            } else if (
              typeof newContent === 'object' ||
              oldSubContent !== newContent
            ) {
              curAtomicChange = atomicChanges.createSubChange(
                ChangeType.UPDATE,
                subElem,
                newContent
              );
            }

            if (curAtomicChange)
              this.compareRecursiveIfNeeded(
                srcChange,
                oldSubContent,
                newContent,
                pointer,
                curAtomicChange
              );
            if (subElem.length > 0)
              // Special case when changing the root element (subElem = '')
              this.insertProperty(
                oldContent,
                subElem,
                newContent,
                srcChange.beforeKey
              );
          }
          break;
        case ChangeType.DELETE:
          {
            if (oldContent[subElem]) {
              const curAtomicChange = atomicChanges.createSubChange(
                ChangeType.DELETE,
                subElem,
                null
              );
              this.compareRecursiveIfNeeded(
                srcChange,
                oldContent[subElem],
                newContent,
                pointer,
                curAtomicChange
              );
              delete oldContent[subElem];
            }
          }
          break;
        case ChangeType.MOVE:
          {
            // If it's the root of move, then find the value to move from the oldPosition
            if (srcChange.position === pointer.position) {
              if (oldPosition == null)
                throw new Error(
                  'Cannot process MOVE change without oldPosition' +
                    srcChange.position
                );
              if (newContent == null) {
                newContent = this.findAtPosition(oldPosition);
              }
              if (newContent) {
                const curAtomicChange = atomicChanges.createSubChange(
                  ChangeType.MOVE,
                  subElem,
                  newContent,
                  oldPosition
                );
                if (srcChange.position !== oldPosition) {
                  // When we reorder elements of an array, it's a move to the same position: No changes
                  this.compareRecursiveIfNeeded(
                    srcChange,
                    null,
                    newContent,
                    pointer,
                    curAtomicChange,
                    oldPosition
                  );
                  this.insertProperty(
                    oldContent,
                    subElem,
                    newContent,
                    srcChange.beforeKey
                  );
                  // Really perform the change
                  const splittedPosition =
                    DontCodeModelPointer.splitPosition(oldPosition)!;
                  const parentContent = this.findAtPosition(
                    splittedPosition.parent
                  );
                  delete parentContent[splittedPosition.element];
                } else {
                  // Just insert the same element at a different position in the object
                  this.compareRecursiveIfNeeded(
                    srcChange,
                    null,
                    newContent,
                    pointer,
                    curAtomicChange,
                    oldPosition
                  );
                  this.insertProperty(
                    oldContent,
                    subElem,
                    newContent,
                    srcChange.beforeKey
                  );
                }
              }
            } else {
              // The move has already been done, so just createSubChange and loop through subElements
              const curAtomicChange = atomicChanges.createSubChange(
                ChangeType.MOVE,
                subElem,
                null,
                oldPosition
              );
              this.compareRecursiveIfNeeded(
                srcChange,
                oldContent,
                newContent,
                pointer,
                curAtomicChange,
                oldPosition
              );
            }
          }
          break;
        default:
          throw new Error('No support for change of type ' + srcChange.type);
      }
    } else {
      this.compareRecursiveIfNeeded(
        srcChange,
        oldContent,
        newContent,
        pointer,
        atomicChanges,
        oldPosition
      );
    }
  }

  /**
   * Check if the values are the same, or the objects property names are the same, so that we can define it impacts or not the parent
   * @param oldValue
   * @param newValue
   */
  isTheSameForParent(oldValue: any, newValue: any): boolean {
    if (newValue === oldValue) {
      return true;
    } else if (newValue == null || oldValue == null) {
      return false;
    } else if (typeof oldValue === 'object' && typeof newValue === 'object') {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);
      return (
        oldKeys.length === newKeys.length &&
        oldKeys.every((value, index) => {
          return value === newKeys[index];
        })
      );
    } else {
      return oldValue === newValue;
    }
  }

  /**
   * By checking the differences between old and new content, and depending on the src change type, generate a change for each sub element hierarchically
   * @param src
   * @param oldContent
   * @param newContent
   * @param atomicChanges
   */
  compareRecursiveIfNeeded(
    src: Change,
    oldContent: any,
    newContent: any,
    pointer: DontCodeModelPointer,
    atomicChanges: AtomicChange,
    oldPosition?: string
  ): void {
    if (oldContent == null || typeof oldContent !== 'object') oldContent = {};
    if (newContent == null || typeof newContent !== 'object') newContent = {};
    const alreadyChecked = new Set<string>();

    // Check if existing elements have been deleted or updated
    for (const oldSubProperty in oldContent) {
      const subPointer = this.schemaMgr.generateSubSchemaPointer(
        pointer,
        oldSubProperty
      );
      const subPosition = subPointer.position;
      alreadyChecked.add(oldSubProperty);
      if (newContent.hasOwnProperty(oldSubProperty)) {
        this.applyChangeRecursive(
          src,
          oldContent,
          newContent[oldSubProperty],
          subPointer,
          atomicChanges,
          oldPosition
        );
      } else {
        //        if ((src.type===ChangeType.RESET) || (!this.schemaMgr.locateItem(pointer.position, false).isArray())) {
        // It doesn't exist in the new element, so it's deleted
        this.applyChangeRecursive(
          new Change(ChangeType.DELETE, subPosition, null, subPointer),
          oldContent,
          null,
          subPointer,
          atomicChanges,
          oldPosition
        );
        //        }
      }
    }

    // Check if new elements have been added
    for (const newSubProperty in newContent) {
      if (src.type === ChangeType.MOVE) {
        const subPointer = this.schemaMgr.generateSubSchemaPointer(
          pointer,
          newSubProperty
        );
        const subPosition = subPointer.position;
        //src.oldPosition = subPosition;
        this.applyChangeRecursive(
          src,
          oldContent,
          newContent[newSubProperty],
          subPointer,
          atomicChanges,
          oldPosition + '/' + newSubProperty
        );
      } else if (!alreadyChecked.has(newSubProperty)) {
        const subPointer = this.schemaMgr.generateSubSchemaPointer(
          pointer,
          newSubProperty
        );
        const subPosition = subPointer.position;
        this.applyChangeRecursive(
          new Change(
            ChangeType.ADD,
            subPosition,
            newContent[newSubProperty],
            subPointer
          ),
          oldContent,
          newContent[newSubProperty],
          subPointer,
          atomicChanges
        );
      }
    }
  }

  protected generateChanges(
    src: Change,
    atomicChanges: AtomicChange,
    pointer?: DontCodeModelPointer,
    result?: Array<Change>
  ): Array<Change> {
    if (result == null) result = new Array<Change>();

    if (src.pointer == null)
      throw new Error('Cannot generate changes without the pointer');

    if (pointer == null) pointer = src.pointer;

    if (atomicChanges.type != null) {
      //pointer = this.schemaMgr.generateSubSchemaPointer(pointer, atomicChanges.name);
      if (atomicChanges.type === ChangeType.MOVE) {
        if (atomicChanges.oldPosition == null)
          throw new Error(
            'A Move Change must have an oldPosition set ' + pointer.position
          );
        if (
          atomicChanges.oldPosition !== pointer.position &&
          src.position === pointer.position
        ) {
          // Generate an update of the old position only if it's different from the new position, as for the new position an update has already been generated
          result.push(
            new Change(
              ChangeType.UPDATE,
              DontCodeModelPointer.parentPosition(atomicChanges.oldPosition)!,
              atomicChanges.value
            )
          );
        }
        result.push(
          new Change(
            ChangeType.MOVE,
            pointer.position,
            atomicChanges.value,
            pointer,
            undefined,
            atomicChanges.oldPosition
          )
        );
      } else {
        result.push(
          new Change(
            atomicChanges.type,
            pointer.position,
            atomicChanges.value,
            pointer
          )
        );
      }
    } else {
      // First check if we need to send an UPDATED change to this element because a subElement is added / removed
      for (let i = 0; i < atomicChanges.subChanges.length; i++) {
        const cur = atomicChanges.subChanges[i];
        if (
          cur.type != null &&
          cur.type !== ChangeType.UPDATE &&
          cur.name.length > 0
        ) {
          result.push(
            new Change(
              ChangeType.UPDATE,
              pointer.position,
              this.findAtPosition(pointer.position),
              pointer
            )
          );
          break;
        }
        /*if( (cur.type === ChangeType.MOVE) && (cur.oldPosition != null)) {
          result.push(new Change (ChangeType.UPDATE, cur.oldPosition, null));
        }*/
      }
    }

    // Then recurse through all subelements, generating changes along the way
    for (let i = 0; i < atomicChanges.subChanges.length; i++) {
      const cur = atomicChanges.subChanges[i];
      this.generateChanges(
        src,
        cur,
        this.schemaMgr.generateSubSchemaPointer(pointer, cur.name),
        result
      );
    }

    return result;
  }

  /**
   * Calculates a key that can be inserted at the given position in the content
   * @param pos
   */
  generateNextKeyForPosition(pos:string, create=false):string {
    const array=this.findAtPosition(pos, create);
    if(array==null)
      throw new Error("No element at position "+pos);
    return DontCodeModelManager.generateNextKey(array);
  }

  static generateNextKey(array:Record<string, unknown>|Set<string>):string {
    let keys:Set<string>;
    if (array.size != null) {
      keys = array as Set<string>;
    } else {
      keys = new Set(Object.keys(array));
    }
    let tentative = keys.size;
    let found = false;
    const modulo=DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS_LENGTH;
    let key;
    do {
      // Calculate a tentative key
      key='';
      do {
        const quotient = Math.trunc(tentative/modulo);
        const rest = tentative%modulo;

        key = DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS[rest].concat(key);
        tentative=quotient-1; // -1 because we need to not take into account the first row of values as they don't have the same number of chars

      } while (tentative>=0);

      // Check if the key is already present
      found = keys.has(key);
      tentative++;
    } while(found);
    return key;
  }

  /**
   * Provides the json extract at the given position.
   * For example, findAtPosition ('creation/entities/a') will returns the description (fields...) of the first entity created with the editor
   * @param position
   * @param create
   */
  findAtPosition(
    position: string,
    create?: boolean,
    added?: AtomicChange
  ): any {
    const path = position.split('/');
    if (this.content == null) {
      if (create) {
        this.content = {};
      } else {
        return null;
      }
    }

    let current = this.content;
    let currentPath = '';

    path.forEach((element) => {
      if (element === '' || current === null) return current;
      if (currentPath.length === 0) currentPath = element;
      else currentPath = currentPath + '/' + element;
      if (!current[element]) {
        if (create) {
          current[element] = {};
          if (added) {
            added = added.createSubChange(ChangeType.ADD, element, {});
          }
        } else {
          current = null;
          return null;
        }
      }

      current = current[element];
    });
    return current;
  }

  /**
   * Enable querying the model for any value, following jsonPath model
   * To use when potentially you expect multiple values
   * @param query: the query as a jsonPath
   * @param position: in case the jsonPath is relative
   */
  queryModelToArray(query: string, position?: string): Array<any> {
    let root = this.content;
    if (position) {
      root = this.findAtPosition(position, false);
    }
    const result = JSONPath({
      path: query,
      json: root,
      resultType: 'value',
      wrap: false,
      flatten: true,
    });
    return result;
  }

  /**
   * Enable querying the model for any value, following jsonPath model
   * To use when potentially you expect a single value.
   * @param query: the query as a  jsonPath
   * @param position: in case the jsonPath is relative
   */
  queryModelToSingle(query: string, position?: string): ModelQuerySingleResult {
    let root = this.content;
    if (position) {
      root = this.findAtPosition(position, false);
    }
    let result = JSONPath({
      path: query,
      json: root,
      resultType: 'all',
      wrap: false,
    });
    if (Array.isArray(result)) {
      if (result.length <= 1) result = result[0];
      else
        throw new Error(
          'Multiple results returned by queryModelToSingle with path ' + query
        );
    }
      // In Dont-code, on the contrary of Json Pointer, you don't start a pointer by /
    if (result?.pointer?.startsWith('/')) {
      result.pointer=result.pointer.substring(1);
    }
    delete result.path;
    delete result.parent;
    delete result.parentProperty;
    return result as ModelQuerySingleResult;
  }

  /**
   * Returns the list of values that are possible target of a given property path. With this the Builder User Interface can display to the user a combo-box will all targets
   * For example, with the following Dont-code model:
   * "from": {
   *           "type": "string",
   *           "format": "$.creation.sources.name"
   *         }
   *
   * findAllPossibleTargetsOrProperty ("from", ...) will returns all sources names.
   * @param property
   * @param position
   * @param schemaItem
   */
  findAllPossibleTargetsOfProperty(
    property: string,
    position: string,
    schemaItem?: DontCodeSchemaItem
  ): Array<any> {
    if (schemaItem==null) {
      const ptr = this.schemaMgr.generateSchemaPointer(position);
      schemaItem = this.schemaMgr.locateItem(
        ptr.subPropertyPointer(property).positionInSchema,
        true
      );
    }
    const targetPath = schemaItem?.getTargetPath();
    if (schemaItem && targetPath) {
      const lastDotPos = targetPath.lastIndexOf('.');
      return this.queryModelToArray(targetPath.substring(0, lastDotPos) + '.*');
    } else {
      throw new Error(
        'No Schema or no format definition for ' + position + '/' + property
      );
    }
  }

  /**
   * Returns the exact element that matches the target of a given property path.
   *
   * For example, with the following Dont-code model:
   * "from": {
   *           "type": "string",
   *           "format": "$.creation.sources.name"
   *         }
   *
   * and an instantiated model like this:
   * {
   *   "from": "EntityName"
   * }
   * findAllPossibleTargetsOrProperty ("from", ...) will return only the source named "EntityName".
   * @param property
   * @param position
   * @param schemaItem
   */
  findTargetOfProperty(
    property: string,
    position: string,
    schemaItem?: DontCodeSchemaItem
  ): ModelQuerySingleResult|null {
    const src = this.findAtPosition(position, false);
    if (src && src[property]) {
      if (schemaItem==null) {
        const ptr = this.schemaMgr.generateSchemaPointer(position);
        schemaItem = this.schemaMgr.locateItem(
          ptr.subPropertyPointer(property).positionInSchema,
          true
        );
      }
      const targetPath = schemaItem?.getTargetPath();
      if (schemaItem && targetPath) {
        const lastDotPos = targetPath.lastIndexOf('.');
        //        const filteredQuery = targetPath.substring(0, lastDotPos)+'[?(@.'+targetPath.substring(lastDotPos+1)+'==="'+src[property]+'")]';
        const filteredQuery =
          targetPath.substring(0, lastDotPos) +
          "[?(@['" +
          targetPath.substring(lastDotPos + 1) +
          '\']==="' +
          src[property] +
          '")]';
        return this.queryModelToSingle(filteredQuery);
      } else {
        throw new Error(
          'No Schema or no format definition for ' + position + '/' + property
        );
      }
    }
    return null;
  }

  /**
   * Insert a property at the end of an object or before the specified property
   * @param parent
   * @param propName
   * @param value
   * @param beforeProp
   */
  insertProperty(
    parent: any,
    propName: string,
    value: any,
    beforeProp?: string
  ) {
    if (beforeProp) {
      // Reinsert all properties of the object and inject the new one at the right order
      const keys = Object.keys(parent);
      for (const key of keys) {
        if (key !== propName) {
          const copy = parent[key];
          delete parent[key];
          if (key === beforeProp) {
            if (parent[propName] !== undefined) delete parent[propName];
            parent[propName] = value;
          }
          parent[key] = copy;
        }
      }
    } else {
      if (parent[propName] !== undefined) delete parent[propName];
      parent[propName] = value;
    }
  }

  /**
   * From a DefinitionUpdateConfig given by a repository configuration, generates a Change that can be applied to the model.
   * @param definition
   */
  convertToChange (definition: DefinitionUpdateConfig): Change {
    let ptr=this.schemaMgr.generateSchemaPointer(definition.location.parent);
    const schemaItem = this.schemaMgr.locateItem(ptr.positionInSchema, false);
    if( schemaItem.isArray()) {
      if ((definition.location.id==null) || (definition.location.id==='*')) {
        // We must create a subelement
        ptr = ptr.subItemPointer(this.generateNextKeyForPosition(ptr.position, true));
      } else {
        ptr = ptr.subItemPointer(definition.location.id);
      }
    } else {
      if (definition.location.id!=null) {
        ptr = ptr.subItemPointer(definition.location.id);
      }
    }
    return new Change(ChangeType.ADD, ptr.position, definition.update
        ,ptr
        ,definition.location.after);

  }
  /**
   * Adds to the model the updates of configuration defined by the plugin or by the repository
   * @param defs
   */
  applyPluginConfigUpdates (defs: DefinitionUpdateConfig[] | undefined):void {
    if (defs!=null) {
      defs.forEach( definition => {
        this.applyChange(this.convertToChange(definition))
      })
    }

  }

  /**
   * Try to guess which field is most likely to represent the name of an object (ususally a field with name "name", or "title")
   * @param position
   * @param modelAsJson
   */
  guessPropertyRepresentingName (position:string|null, modelAsJson:any): string|null {
    if( modelAsJson==null) {
      if (position==null)
        throw new Error ("Either position or model must be provided");
      modelAsJson = this.findAtPosition(position, false);
      if (modelAsJson==null) {
        throw new Error ("Position "+position+" does not exist in model");
      }
    }
    if ((modelAsJson.fields != null) && (Array.isArray(modelAsJson.fields)))
      modelAsJson=modelAsJson.fields;

    const curScore:{score:number, field:any} = {score:-1, field:null};

    for (const field in modelAsJson) {
        if (DontCodeModelManager.scoreNameFieldFromProperty(modelAsJson[field].name, curScore))
          break;
    }

    if (curScore.score>0) {
      return curScore.field;
    } else
      return null;

  }

  protected static scoreNameFieldFromProperty (name:string, score:{score:number, field:any}): boolean {
    if( name==null)
      return false;
    const propName=name.toLowerCase();
    // Finds if the element is the id field
    if( propName === "name") {
      score.field=name;  // Don't need to process Id
      score.score = 100;
      return true;
    } else {
      if ((propName == "title")||(propName=="lastname")) {
        if (score.score<80) {
          score.score=80;
          score.field=name;
        }
      } else if (propName.includes("name")||propName.includes("title")) {
        if (score.score<50) {
          score.score = 50;
          score.field=name;
        }
      }
      return false;
    }
  }

}

class AtomicChange {
  type!: ChangeType;
  name = '';
  subChanges = new Array<AtomicChange>();
  isRoot = false;
  oldPosition: string | undefined;
  value: any;

  constructor(
    type?: ChangeType,
    name?: string,
    value?: any,
    oldPosition?: string
  ) {
    if (type) this.type = type;
    if (name) this.name = name;
    this.oldPosition = oldPosition;
    this.value = value;
  }

  createSubChange(
    type: ChangeType | undefined,
    elementName: string,
    value: any,
    oldPosition?: string
  ): AtomicChange {
    const newChange = new AtomicChange(type, elementName, value, oldPosition);
    this.subChanges.push(newChange);
    return newChange;
  }
}

export class ModelQuerySingleResult {
  value?:any;
  pointer!:string;
}
