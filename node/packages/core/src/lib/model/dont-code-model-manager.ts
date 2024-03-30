import {Change, ChangeType} from '../change/change';
import {DontCodeSchemaItem} from './dont-code-schema-item';
import {DontCodeSchemaManager} from './dont-code-schema-manager';
import {JSONPath} from 'jsonpath-plus';
import {DontCodeModelPointer} from './dont-code-schema';
import {DefinitionUpdateConfig} from "../globals";
import {Action} from "../action/action";

/**
 * Stores and constantly updates the json (as an instance of the DontCodeSchema) as it is being edited / modified through Change events
 * It does not store the entity values but the description of entities, screens... as defined in the Editor
 */
export class DontCodeModelManager {
  protected content: any;

  static readonly POSSIBLE_CHARS_FOR_ARRAY_KEYS = "abcdefghijklmnopqrstuvxyz";
  static readonly POSSIBLE_CHARS_FOR_ARRAY_KEYS_LENGTH = DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS.length;

  constructor(protected schemaMgr: DontCodeSchemaManager) {
    this.reset();
  }

  reset() {
    this.content = undefined;
  }

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

    if( toApply.type===ChangeType.ACTION) {
      lastChange.type=ChangeType.ACTION;
    }

    const isAnUpdate = this.applyChangeRecursive(
      toApply,
      content,
      toApply.value,
      toApply.pointer,
      lastChange
    );
    return this.generateChanges(
      toApply,
      atomicChanges,
      isAnUpdate,
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
  ): boolean {
    if (srcChange.pointer == null)
      throw new Error(
        'Cannot apply a change without a pointer at position ' +
        srcChange.position
      );

    let isAnUpdate=true;
    if (oldPosition == null) oldPosition = srcChange.oldPosition;

    const subElem = pointer.lastElement;
    if (subElem || subElem.length === 0) {
      //const subPointer = pointer.subItemOrPropertyPointer(subElem, pointer?.key==null);
      const oldSubContent =
        subElem.length === 0 ? oldContent : oldContent[subElem];
      switch (srcChange.type) {
        case ChangeType.ACTION: {

          // An action doesn't modify the data but must be created for each subelement
          const curAtomicChange = atomicChanges.createSubChange(ChangeType.ACTION, subElem, atomicChanges.value);
          this.compareRecursiveIfNeeded(srcChange, oldSubContent,null,pointer, curAtomicChange);
          break;
        }
        case ChangeType.ADD:
        case ChangeType.UPDATE:
        case ChangeType.RESET: {
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
            if ((typeof oldSubContent === 'object') && (srcChange.type==ChangeType.ADD)) {
              // Verify that when asked to add a subitem, it's really an add, that means, at least one subproperty doesn't exist.
              // Otherwise it's a UPDATE change
              isAnUpdate=false;
              for (const subProperty of Object.getOwnPropertyNames(newContent)) {
                if (oldSubContent[subProperty]!=undefined) {  // At least one element is already present
                  isAnUpdate=true;
                  break;
                }
              }
            }

            curAtomicChange = atomicChanges.createSubChange(
              ChangeType.UPDATE,  // Even if it's an ADD of a subElement, we consider it's an UPDATE for the parent
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
          if ((subElem.length > 0) && (isAnUpdate))
            // Special case when changing the root element (subElem = '')
            this.insertProperty(
              oldContent,
              subElem,
              newContent,
              srcChange.beforeKey
            );
        }
          break;
        case ChangeType.DELETE: {
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
        case ChangeType.MOVE: {
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
    return isAnUpdate;
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
      // eslint-disable-next-line no-prototype-builtins
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
          // Action are just passed to all subElements
        if (src.type==ChangeType.ACTION) {
          const srcAction = src as Action;
          this.applyChangeRecursive(new Action(subPosition, srcAction.value, srcAction.context, srcAction.actionType, subPointer, srcAction.running),
            oldContent, null, subPointer, atomicChanges);
        } else if (src.type!=ChangeType.ADD){
          // It doesn't exist in the new element, so if not explicitely added, then it's deleted
          this.applyChangeRecursive(
            new Change(ChangeType.DELETE, subPosition, null, subPointer),
            oldContent,
            null,
            subPointer,
            atomicChanges,
            oldPosition
          );
        }
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
    isAnUpdate: boolean,
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
        if ( atomicChanges.type===ChangeType.ACTION) {
            // Create an action for Change of action type
          const srcAction = src as Action;
          result.push(
            new Action(
              pointer.position,
              srcAction.value,
              srcAction.context,
              srcAction.actionType,
              pointer,
              srcAction.running
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
          if( isAnUpdate==true) {  // Sometimes we receive ADD but they are UPDATE in fact
            result.push(
              new Change(
                ChangeType.UPDATE,
                pointer.position,
                this.findAtPosition(pointer.position),
                pointer
              )
            );
          }
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
        true, // It's never an incorrect update for subelements
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
  generateNextKeyForPosition(pos: string, create = false): string {
    const array = this.findAtPosition(pos, create);
    if (array == null)
      throw new Error("No element at position " + pos);
    return DontCodeModelManager.generateNextKey(array);
  }

  static generateNextKey(array: Record<string, unknown> | Set<string>): string {
    let keys: Set<string>;
    if (array.size != null) {
      keys = array as Set<string>;
    } else {
      keys = new Set(Object.keys(array));
    }
    let tentative = keys.size;
    let found = false;
    const modulo = DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS_LENGTH;
    let key;
    do {
      // Calculate a tentative key
      key = '';
      do {
        const quotient = Math.trunc(tentative / modulo);
        const rest = tentative % modulo;

        key = DontCodeModelManager.POSSIBLE_CHARS_FOR_ARRAY_KEYS[rest].concat(key);
        tentative = quotient - 1; // -1 because we need to not take into account the first row of values as they don't have the same number of chars

      } while (tentative >= 0);

      // Check if the key is already present
      found = keys.has(key);
      tentative++;
    } while (found);
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
  queryModelToSingle(query: string, position?: string): ModelQuerySingleResult|null {
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
      result.pointer = result.pointer.substring(1);
    }

    if (result != null) {
      delete result.path;
      delete result.parent;
      delete result.parentProperty;
    }
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
    if (schemaItem == null) {
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
  ): ModelQuerySingleResult | null {
    const src = this.findAtPosition(position, false);
    if (src && src[property]) {
      if (schemaItem == null) {
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
  convertToChange(definition: DefinitionUpdateConfig): Change {
    let ptr = this.schemaMgr.generateSchemaPointer(definition.location.parent);
    const schemaItem = this.schemaMgr.locateItem(ptr.positionInSchema, false);
    if (schemaItem.isArray()) {
      if ((definition.location.id == null) || (definition.location.id === '*')) {
        // We must create a subelement
        ptr = ptr.subItemPointer(this.generateNextKeyForPosition(ptr.position, true));
      } else {
        ptr = ptr.subItemPointer(definition.location.id);
      }
    } else {
      if (definition.location.id != null) {
        ptr = ptr.subItemPointer(definition.location.id);
      }
    }
    return new Change(ChangeType.ADD, ptr.position, definition.update
      , ptr
      , definition.location.after);

  }

  /**
   * Try to guess which field is most likely to represent the name of an object (ususally a field with name "name", or "title")
   * @param position
   * @param modelAsJson
   */
  guessNamePropertyOfElement(position: string | null, modelAsJson: any): string | null {
    if (modelAsJson == null) {
      if (position == null)
        throw new Error("Either position or model must be provided");
      modelAsJson = this.findAtPosition(position, false);
      if (modelAsJson == null) {
        throw new Error("Position " + position + " does not exist in model");
      }
    }
    if ((modelAsJson.fields != null) && (Array.isArray(modelAsJson.fields)))
      modelAsJson = modelAsJson.fields;

    const curScore: { score: number, field: any } = {score: -1, field: null};

    for (const field in modelAsJson) {
      if (DontCodeModelManager.scoreFieldAsName(modelAsJson[field].name, modelAsJson[field].type, curScore))
        break;
    }

    if (curScore.score > 0) {
      return curScore.field;
    } else
      return null;

  }

  public static guessNamePropertyOfObject(obj: any): string | null {
    const score: { score: number, field: any } = {score: -1, field: null};
    for (const prop in obj) {
      DontCodeModelManager.scoreFieldAsName(prop, 'Text', score);
    }
    if (score.score > 0)
      return score.field;
    else
      return null;
  }

  public static guessNamePropertyFromList(...list: string[]): string | null {
    const score: { score: number, field: any } = {score: -1, field: null};
    for (const prop of list) {
      DontCodeModelManager.scoreFieldAsName(prop, 'Text', score);
    }
    if (score.score > 0)
      return score.field;
    else
      return null;
  }

  /**
   * Checks the probability the name given (and type) is field name that represents the name of the element.
   * @param name
   * @param type
   * @param score
   * @protected
   */
  protected static scoreFieldAsName(name: string, type: string, score: { score: number, field: any }): boolean {
    if (name == null)
      return false;
    const propName = name.toLowerCase();
    for (const [key, value] of this.NAME_PROPERTY_NAMES) {
      if (propName === key) {
        const foundScore = value ?? 0;
        if (score.score < foundScore) {
          score.score = foundScore;
          score.field = name;
          if (score.score == 100)
            return true;
        }
      } else if (propName.includes(key)) {
        const foundScore = (value ?? 0) / 2;
        if (score.score < foundScore) {
          score.score = foundScore;
          score.field = name;
        }
      }
    }

    if (type == "Text") {
      if (score.score < 20) {
        score.score = 20;
        score.field = name;
      }
    }

    if (score.score > 0) return true;
    else return false;
  }

  protected static readonly NAME_PROPERTY_NAMES = new Map<string, number>([
    ['name', 100],
    ['nom', 100],
    ['title', 80],
    ['titre', 80],
    ['lastname', 80],
    ['label', 70],
    ['libellé', 70]
  ])

  /**
   * Extract the value of any data in parameter. It can handle complex data and flattens it into something that you can calculate or act upon (number or string)
   * @param obj
   * @param metaData Will store information about how to extract the data for this item. Will accelerate greatly extraction for other similar data.
   * @param position
   * @param schemaItem
   * @protected
   */
  public extractValue<T>(obj: T, metaData: DataTransformationInfo, position?: DontCodeModelPointer, schemaItem?: DontCodeSchemaItem): any {
    if (obj == null)
      return obj;
    if (!metaData.parsed) {
      this.extractMetaData(obj, metaData, position, schemaItem);
    }

    // We already know what to do
    if (metaData.direct) {
      return obj;
    } else {
      if (metaData.array) {
        if ((obj as Array<T>).length > 0) {
          obj = (obj as Array<T>)[0];
        } else return obj;
      }
      if (metaData.subValue != null) {
        return (obj as any)[metaData.subValue];
      } else if (metaData.subValues!=null) {

        for (let i=0;i<metaData.subValues.length; i++) {
          obj=(obj as any)[metaData.subValues[i]];
          if (obj==null) break;
        }
        return obj;

      } else {
        // If we couldn't determine the object's value, maybe it's because the value is not present
        return undefined;
      }
    }
  }

  /**
   * Apply the primitive value back in the object
   * @param obj
   * @param value
   * @param metaData Will store information about how to extract the data for this item. Will accelerate greatly extraction for other similar data.
   * @param valueObj if any, the object that contained the source. In case you want to apply other values of the source as well
   * @param position
   * @param schemaItem
   * @return The object with the primitive set or the value if the obj is indeed a primitive already
   */
  public applyValue <T>(obj: T, value:any, metaData: DataTransformationInfo, valueObj?: T, position?: DontCodeModelPointer, schemaItem?: DontCodeSchemaItem): T {
    if (obj == null)
      return value;

    if (!metaData.parsed) {
      this.extractMetaData(obj, metaData, position, schemaItem);
    }

    // We already know what to do
    if (metaData.direct) {
      return value as unknown as T;
    } else {
      if (metaData.array) {
          // We extract the first element of the array
        if ((obj as Array<T>).length > 0) {
          obj = (obj as Array<T>)[0];
        } else {
          if (value!=undefined) // Only undefined are not pushed, null values can be pushed
            (obj as Array<T>).push(value as unknown as T);
          return obj
        }
      }
      if (metaData.subValue != null) {
        if( value===undefined) {
          delete (obj as any)[metaData.subValue];
        } else {
          (obj as any)[metaData.subValue]=value;
        }
      } else if (metaData.subValues != null) {
        let curObj = obj as any;
        if (value === undefined) {
          for (let i=0;i<metaData.subValues.length-1; i++) {
            curObj=curObj[metaData.subValues[i]];
            if (curObj==null) break;
          }
            // Delete the element only it there was one
          if( (curObj!=null) && (curObj[metaData.subValues[metaData.subValues.length-1]]!=undefined)) {
              delete curObj[metaData.subValues[metaData.subValues.length-1]];

          }
        } else {
          for (let i=0;i<metaData.subValues.length-1; i++) {
            if (curObj[metaData.subValues[i]]==undefined) {
              curObj[metaData.subValues[i]]={};
            }
            curObj = curObj[metaData.subValues[i]];
          }

          if ((curObj[metaData.subValues[metaData.subValues.length-1]]==null) && (valueObj!=null)) {
            let curValueObj=valueObj as any;
            for (let i=0;i<metaData.subValues.length-1; i++) {
              if (curValueObj[metaData.subValues[i]]==null) {
                curValueObj=null;
                break;
              }
              curValueObj = curValueObj[metaData.subValues[i]];
            }
  
            if (curValueObj!=null) {
                // The element to copy to was null, so let's copy all properties from the second element
                for (const valueProp in curValueObj) {

                  if ((curObj[valueProp]==null) && (curValueObj[valueProp]!=null)) {
                    curObj[valueProp]= structuredClone (curValueObj[valueProp]);
                  }
                }
              }
          }
            // apply the value
          curObj[metaData.subValues[metaData.subValues.length-1]]=value;
        }
      }
      return obj;
    }
  }

  /**
   * Sorts the values in place. If the value is a complex type, extract a comparable item before
   * @param values 
   * @param field if any field must be used for the sort
   * @param sortOrder Optionally provides a sort order (positive or negative) to support multiple sorts
   * @param metaData 
   */
  public sortValues<T> (values:T[], sortOrder = 1, field?: string, metaData?: DataTransformationInfo,position?: DontCodeModelPointer, schemaItem?: DontCodeSchemaItem): void {
    const metaInfo = metaData?? new DataTransformationInfo();

    if (!metaInfo.parsed) {
      for (const val of values) {
        this.extractMetaData(this.extractField (val, field), metaInfo, position, schemaItem);
        if (metaInfo.parsed) break;
      }
    }

    if (metaInfo.parsed) {
      values.sort ((first, second) => {
        const firstValue = this.extractValue (this.extractField(first, field), metaInfo, position, schemaItem );
        const secondValue = this.extractValue (this.extractField(second, field), metaInfo, position, schemaItem );

        if (firstValue==null) {
          if (secondValue==null) return 0;
          else return -sortOrder;
        } else if (secondValue==null) return sortOrder;

        // firstValue and secondValue are now either string, number or Date

        if ((typeof firstValue === 'string') && (typeof secondValue === 'string')) {
            return sortOrder*(firstValue as string).localeCompare (secondValue);
        }

        return firstValue < secondValue ? -sortOrder : firstValue > secondValue ? sortOrder : 0;
      });
    } else {
      console.warn ('Cannot sort array of unknown values');
      return;
    }

  } 

  /**
   * Guess how values can be set or extracted from an unknown object
   * @param obj
   * @param metaData
   * @param position
   * @param schemaItem
   */
  public extractMetaData<T>(obj: T, metaData: DataTransformationInfo, position?: DontCodeModelPointer, schemaItem?: DontCodeSchemaItem): void {

    if( obj == null) return;
    metaData.parsed = true;
    metaData.subValue = null;
    metaData.subValues = null;
    if (typeof obj !== 'object') {
      if (obj != null) {
        metaData.direct = true;
      } else {
        metaData.parsed = false;
      }
    } else {
      if (Array.isArray(obj)) {
        metaData.array = true;
        // eslint-disable-next-line no-restricted-syntax
        console.debug("Getting an array as a value for metadata extraction", obj);
        if ((obj as Array<any>).length > 0) {
          obj = (obj as Array<any>)[0];
        } else {
          metaData.parsed = false;
        }
      }
      if (obj instanceof Date) {
        metaData.direct = true;
      } else {
        // It's an unknown object
        if ((obj as any).value !== undefined) {
          metaData.subValue = 'value';
        } else if ((obj as any).amount !== undefined) {
          // It's an MoneyAmount
          metaData.subValue = 'amount';
        } else if ((obj as any).cost !== undefined) {
            // It's a PriceModel
          metaData.subValues = ['cost','amount'];
        } else {
          let firstKey = null;
          for (const key in obj) {
            if (firstKey == null) firstKey = key;
            if ((obj[key] != null) && (typeof (obj[key]) !== 'object')) {
              metaData.subValue = key;
            }
          }
          if ((metaData.subValue == null)&& (metaData.subValues==null)) {
            if ((typeof obj!=='object') || (obj instanceof Date)) {
              metaData.subValue = firstKey;
              console.warn("Guessed value key of " + metaData.subValue + ' for object:', obj);
            } else {
              console.warn("Cannot guess value for object: ", obj);
              metaData.parsed=false;
              metaData.subValue=null;
              metaData.subValues=null;
              metaData.direct=false;
              metaData.array=false;
            }
          }

        }
      }
    }
  }


  /**
   * Modify the first element with the value of the second element by applying the operator given in parameter
   * @param firstElement
   * @param secondElement
   * @param metaData Will store information about how to extract the data for this item. Will accelerate greatly extraction for other similar data.
   * @param operator
   * @param position
   * @param schemaItem
   * @protected
   */
  public modifyValues<T>(firstElement: T, secondElement: T, metaData: DataTransformationInfo, operator: (firstValue: any, secondValue: any) => any , position?: DontCodeModelPointer, schemaItem?: DontCodeSchemaItem): T {
    if (firstElement == null) {
      throw new Error("Cannot modify value of null object");
    }
    const firstValue = this.extractValue(firstElement, metaData, position, schemaItem);
    const secondValue =this.extractValue(secondElement, metaData, position, schemaItem); 
    const calculatedValue = operator(firstValue, secondValue);

      return this.applyValue(firstElement, calculatedValue, metaData, secondElement, position, schemaItem);
  }

  protected extractField(val: any, field?: string): any {
    if( (field!=null) && (val!=null)) return val[field];
    else return val;
  }
  
}
/**
 * Keep track of information about how to extract value of data
 */
export class DataTransformationInfo {
  parsed = false; // Has the element been parsed ?
  array=false; // Is it an array ?
  direct = false; // Is the element already a usable value (not an object)
  subValue:string|null=null; // What field will give the usable value ?
  subValues:string[]|null=null; // What list of fields needs to be following to extract the usable value ?
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

