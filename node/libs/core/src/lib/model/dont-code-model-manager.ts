import {Change, ChangeType} from "../change/change";
import {Subject} from "rxjs";
import {DontCodeSchemaItem} from "./dont-code-schema-item";
import {DontCodeSchemaManager} from "./dont-code-schema-manager";
import {JSONPath} from 'jsonpath-plus';
import {DontCodeModelPointer} from "./dont-code-schema";


/**
 * Stores and constantly updates the json (as an instance of the DontCodeSchema) as it is being edited / modified through Change events
 * It does not store the entity values but the description of entities, screens... as defined in the Editor
 */
export class DontCodeModelManager {
  protected content: any;

  constructor(protected schemaMgr: DontCodeSchemaManager) {
  }

  /**
   * Returns the complete json stored
   */
  getContent (): any {
    return this.content;
  }

  /**
   * Resets the current json content to the one given in parameter
   * @param newContent
   */
  resetContent (newContent: any) {
    this.content = newContent;
  }

  /**
   * Apply the change to the current model and split it into multiple atomic changes for each modified property
   * @param toApply
   */
  applyChange (toApply: Change): Array<Change> {
    let pointer = toApply.pointer??this.schemaMgr.generateSchemaPointer(toApply.position);
    toApply.pointer = pointer;
    const parentPosition = pointer.containerPosition;
    const subElem = toApply.pointer?.lastElement;
    if ((parentPosition!=null) && (subElem!=null))
      pointer = this.schemaMgr.generateParentPointer(pointer)!;

    const atomicChanges = new AtomicChange ();
    atomicChanges.isRoot=true;
    atomicChanges.name = pointer.position;
    let lastChange = atomicChanges;
    let content = this.findAtPosition(pointer.position);

    if( content==null) {
        // Are we trying to delete a non existing content ?
      if ((toApply.type === ChangeType.DELETE) ||
        ((toApply.type === ChangeType.RESET) && (toApply.value == null))) {
        return []; // Nothing has changed
      } else {
        // we are adding something, so create the parent
        content = this.findAtPosition(pointer.position, true, atomicChanges);
        let basePosition = pointer.position;
        while (lastChange.subChanges.length>0) {
          basePosition = basePosition.substring(0, basePosition.lastIndexOf('/'));
          lastChange = lastChange.subChanges[0];
        }
        atomicChanges.name=basePosition;
      }
    }

    this.applyChangeRecursive(toApply, content, toApply.value, toApply.pointer, lastChange);
    return this.generateChanges (toApply, atomicChanges,this.schemaMgr.generateSchemaPointer(atomicChanges.name));
  }

  protected applyChangeRecursive (srcChange: Change, oldContent: any, newContent: any, pointer: DontCodeModelPointer, atomicChanges: AtomicChange, oldPosition?:string): void {
    if( srcChange.pointer == null)
      throw new Error ('Cannot apply a change without a pointer at position '+srcChange.position);

    if( oldPosition==null)
      oldPosition = srcChange.oldPosition;

    const subElem = pointer.lastElement;
    if (subElem) {
      //const subPointer = pointer.subItemOrPropertyPointer(subElem, pointer?.key==null);
      switch (srcChange.type) {
        case ChangeType.ADD:
        case ChangeType.UPDATE:
        case ChangeType.RESET: {
          let curAtomicChange;
          if ((srcChange.type===ChangeType.RESET) && (srcChange.position===pointer.position))  // Create a RESET change for the root element reset only
          {
            if ((typeof (newContent) ==='object') && (this.isTheSameForParent(oldContent[subElem],newContent))) {
              curAtomicChange = atomicChanges.createSubChange(undefined, subElem);
            } else if ((typeof (newContent) === 'object') || (oldContent[subElem]!==newContent)) {
              curAtomicChange= atomicChanges.createSubChange(ChangeType.RESET, subElem);
            }
          } else  if (oldContent[subElem]==null) {
            curAtomicChange= atomicChanges.createSubChange(ChangeType.ADD, subElem);
          } else if ((typeof (newContent)==='object') && (this.isTheSameForParent(oldContent[subElem],newContent))){
            curAtomicChange= atomicChanges.createSubChange(undefined, subElem);
          } else if ((typeof (newContent)==='object') || (oldContent[subElem]!==newContent)){
            curAtomicChange= atomicChanges.createSubChange(ChangeType.UPDATE, subElem);
          }

          if( curAtomicChange)
            this.compareRecursiveIfNeeded (srcChange, oldContent[subElem], newContent, pointer, curAtomicChange);
          this.insertProperty(oldContent, subElem, newContent, srcChange.beforeKey);
        }
        break;
        case ChangeType.DELETE: {
          if( oldContent[subElem]) {
            const curAtomicChange = atomicChanges.createSubChange(ChangeType.DELETE, subElem);
            this.compareRecursiveIfNeeded (srcChange, oldContent[subElem], newContent, pointer, curAtomicChange);
            delete oldContent[subElem];
          }
        }
        break;
        case ChangeType.MOVE: {
          // If it's the root of move, then find the value to move from the oldPosition
          if (srcChange.position===pointer.position) {
            if (oldPosition==null)
              throw new Error ('Cannot process MOVE change without oldPosition'+srcChange.position);
            if (newContent==null) {
              newContent = this.findAtPosition(oldPosition);
            }
            if( newContent) {
              const curAtomicChange = atomicChanges.createSubChange(ChangeType.MOVE, subElem, oldPosition);
              if (srcChange.position!==oldPosition) // When we reorder elements of an array, it's a move to the same position: No changes
              {
                this.compareRecursiveIfNeeded(srcChange, null, newContent, pointer, curAtomicChange, oldPosition);
                this.insertProperty(oldContent, subElem, newContent, srcChange.beforeKey);
                // Really perform the change
                const splittedPosition = DontCodeModelPointer.splitPosition(oldPosition)!;
                const parentContent = this.findAtPosition(splittedPosition.parent);
                delete parentContent[splittedPosition.element];
              }else {
                // Just insert the same element at a different position in the object
                this.insertProperty(oldContent, subElem, newContent, srcChange.beforeKey);
              }
            }
          } else {
            // The move has already been done, so just createSubChange and loop through subElements
            const curAtomicChange = atomicChanges.createSubChange(ChangeType.MOVE, subElem, oldPosition);
            this.compareRecursiveIfNeeded (srcChange, oldContent, newContent, pointer, curAtomicChange, oldPosition);
          }
        }
        break;
        default:
          throw new Error ('No support for change of type '+srcChange.type);
      }
    } else {
      this.compareRecursiveIfNeeded(srcChange, oldContent, newContent, pointer, atomicChanges, oldPosition);
    }

/*    switch (srcChange.type) {
      case ChangeType.ADD:
      case ChangeType.UPDATE: {
            // Create a new property or replace existing one
          if (typeof (srcChange.value) === 'object') {
            if ((subElem) && (content.hasOwnProperty(subElem))) {
              this.generateAtomicSubChanges (srcChange, content[subElem], srcChange.value, srcChange.pointer, atomicChanges);
            } else if (subElem) {
              content[subElem]={};
              content=content[subElem];
              atomicChanges.push(new Change(ChangeType.ADD, srcChange.position, srcChange.value, srcChange.pointer));
              this.generateAtomicSubChanges (srcChange, content, srcChange.value, srcChange.pointer, atomicChanges);
            } else {
              this.generateAtomicSubChanges (srcChange, content, srcChange.value, pointer, atomicChanges);
            }
          } else {
            if( subElem) {
              if( content.hasOwnProperty(subElem)) {
                if (content[subElem]!== srcChange.value) {
                  // Updates the values only if it's different
                  atomicChanges.push(new Change(ChangeType.UPDATE, srcChange.position, srcChange.value, srcChange.pointer));
                  content[subElem] = srcChange.value;
                }
              } else {

                //atomicChanges.push(new Change (ChangeType.UPDATE, pointer.position, null, pointer));  // Tells the parent has been updated
                atomicChanges.push(new Change (ChangeType.ADD, srcChange.position, srcChange.value, srcChange.pointer));
                content[subElem] = srcChange.value;
              }
            }
            else {
              throw new Error('Cannot set element for parent'+ srcChange.pointer);
            }
          }
        }
        break;
      case ChangeType.RESET:
        atomicChanges.push(srcChange);
        if (typeof (srcChange.value) === 'object')
          this.generateAtomicSubChanges (srcChange, content, srcChange.value, pointer, atomicChanges);
        else {
          if( subElem)
            content[subElem] = srcChange.value;
          else {
            throw new Error('Cannot set element for parent'+ srcChange.pointer);
          }
        }
        break;
      case ChangeType.MOVE:
        break;
      case ChangeType.DELETE:
        atomicChanges.push(srcChange);
        if (typeof (srcChange.value) === 'object')
          this.generateAtomicSubChanges (srcChange, content, srcChange.value, pointer, atomicChanges);
        else {
          if( subElem)
            content[subElem] = srcChange.value;
          else {
            throw new Error('Cannot set element for parent'+ srcChange.pointer);
          }
        }
        break;
      default:
        throw new Error ('Invalid change type '+srcChange.type);
    }
*/

  }

  /**
   * Check if the values are the same, or the objects property names are the same, so that we can define it impacts or not the parent
   * @param oldValue
   * @param newValue
   */
  isTheSameForParent (oldValue:any, newValue:any): boolean {
    if ((typeof (oldValue)==='object') && (typeof (newValue)==='object')) {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);
      return ((oldKeys.length===newKeys.length) && (oldKeys.every((value,index) => {
        return value === newKeys[index];
      })));
    } else {
      return oldValue===newValue;
    }
  }

  /**
   * By checking the differences between old and new content, and depending on the src change type, generate a change for each sub element hierarchically
   * @param src
   * @param oldContent
   * @param newContent
   * @param atomicChanges
   */
  compareRecursiveIfNeeded (src: Change, oldContent:any, newContent:any, pointer: DontCodeModelPointer, atomicChanges:AtomicChange, oldPosition?:string): void {
    if( (oldContent==null) || (typeof (oldContent) !== 'object'))
      oldContent = {};
    if( (newContent==null) || (typeof (newContent) !== 'object'))
      newContent = {};
    const alreadyChecked = new Set<string> ();

      // Check if existing elements have been deleted or updated
    for (const oldSubProperty in oldContent) {
      const subPointer = this.schemaMgr.generateSubSchemaPointer(pointer, oldSubProperty);
      const subPosition = subPointer.position;
      alreadyChecked.add(oldSubProperty);
      if (newContent.hasOwnProperty(oldSubProperty)) {
        this.applyChangeRecursive(src, oldContent, newContent[oldSubProperty], subPointer,atomicChanges, oldPosition);
      } else {
//        if ((src.type===ChangeType.RESET) || (!this.schemaMgr.locateItem(pointer.position, false).isArray())) {
          // It doesn't exist in the new element, so it's deleted
          this.applyChangeRecursive(new Change(ChangeType.DELETE, subPosition, null, subPointer),
            oldContent, null, subPointer, atomicChanges, oldPosition);
  //        }
      }
    }

      // Check if new elements have been added
    for (const newSubProperty in newContent) {
      if (src.type===ChangeType.MOVE) {
        const subPointer = this.schemaMgr.generateSubSchemaPointer(pointer, newSubProperty);
        const subPosition = subPointer.position;
        //src.oldPosition = subPosition;
        this.applyChangeRecursive(src,
          oldContent, newContent[newSubProperty], subPointer, atomicChanges, oldPosition+'/'+newSubProperty);

      }
      else if( !alreadyChecked.has(newSubProperty)) {
        const subPointer = this.schemaMgr.generateSubSchemaPointer(pointer, newSubProperty);
        const subPosition = subPointer.position;
        this.applyChangeRecursive(new Change(ChangeType.ADD, subPosition, newContent[newSubProperty], subPointer),
          oldContent, newContent[newSubProperty], subPointer, atomicChanges);
      }
    }
  }

  protected generateChanges(src: Change, atomicChanges: AtomicChange, pointer?:DontCodeModelPointer, result?:Array<Change>): Array<Change> {
    if (result==null)
      result = new Array<Change>();

    if( src.pointer==null)
      throw new Error("Cannot generate changes without the pointer");

    if( pointer == null)
      pointer = src.pointer;

    if (atomicChanges.type!=null) {
      //pointer = this.schemaMgr.generateSubSchemaPointer(pointer, atomicChanges.name);
      if(atomicChanges.type === ChangeType.MOVE) {
        if (atomicChanges.oldPosition==null)
          throw new Error ("A Move Change must have an oldPosition set "+pointer.position );
        if ((atomicChanges.oldPosition!==pointer.position)&& (src.position===pointer.position)) {
          // Generate an update of the old position only if it's different from the new position, as for the new position an update has already been generated
          result.push(new Change (ChangeType.UPDATE, DontCodeModelPointer.parentPosition(atomicChanges.oldPosition)!, null));
        }
        result.push(new Change (ChangeType.MOVE, pointer.position, null, pointer, undefined, atomicChanges.oldPosition));
      } else {
        result.push(new Change(atomicChanges.type, pointer.position, null, pointer));
      }
    } else {
      // First check if we need to send an UPDATED change to this element because a subElement is added / removed
      for (let i=0;i<atomicChanges.subChanges.length;i++) {
        const cur = atomicChanges.subChanges[i];
        if ((cur.type!=null) && (cur.type !== ChangeType.UPDATE)) {
             result.push(new Change (ChangeType.UPDATE, pointer.position, null, pointer));
             break;
        }
        /*if( (cur.type === ChangeType.MOVE) && (cur.oldPosition != null)) {
          result.push(new Change (ChangeType.UPDATE, cur.oldPosition, null));
        }*/
      }
    }

      // Then recurse through all subelements, generating changes along the way
    for (let i=0;i<atomicChanges.subChanges.length;i++) {
      const cur = atomicChanges.subChanges[i];
      this.generateChanges(src, cur, this.schemaMgr.generateSubSchemaPointer(pointer, cur.name), result);
    }

    return result;
  }

  /**
   * Subscribes to the Subject in parameter to receive model updates through changes.
   * Changes are generated by the Editor as the user modifies the application.
   * It then modifies it's internal json to be up to date.
   * @param receivedCommands
   */
  receiveUpdatesFrom(receivedCommands: Subject<Change>) {
    receivedCommands.subscribe (change => {
        const parentPos = change.position.substring (0, change.position.lastIndexOf ('/'));
        const prop = change.position.substring (change.position.lastIndexOf ('/')+1);
        const parent = this.findAtPosition (parentPos, true);
        switch (change.type) {
          case ChangeType.ADD:
          case ChangeType.UPDATE:
          case ChangeType.RESET:
            if( prop==="") {
                // We have to update (or reset) the existing parent itself, not a subproperty represented by prop
              if( change.type===ChangeType.RESET) {
                for (const subProp in parent) {
                  delete parent[subProp];
                }
              }
              for (const subProp in change.value) {
                parent[subProp]=change.value[subProp];
              }
            } else {
              parent[prop]=change.value;
            }
            break;
          case ChangeType.DELETE:
            delete parent[prop];
            break;
          case ChangeType.MOVE: {
            if (change.oldPosition) {
              const oldParentPos = change.oldPosition.substring(0, change.oldPosition.lastIndexOf('/'));
              const oldProp = change.oldPosition.substring(change.oldPosition.lastIndexOf('/') + 1);
              const oldParent = this.findAtPosition(oldParentPos, false);

              // If needed, ensure the order of property is correct in target
              const val = oldParent[oldProp];
              delete oldParent[oldProp];
              if (change.beforeKey) {
                const keys = Object.keys(parent);
                for (const key of keys) {
                  const copy = parent[key];
                  delete parent[key];
                  if (key === change.beforeKey) {
                    parent[prop] = val;
                  }
                  parent[key] = copy;
                }
              } else {
                parent[prop] = val;
              }
            } else {
              throw Error ('We need oldPosition to process MOVE change '+change.position);
            }
            break;
          }
        }
      }

    )
  }

  /**
   * Provides the json extract at the given position.
   * For example, findAtPosition ('creation/entities/a') will returns the description (fields...) of the first entity created with the editor
   * @param position
   * @param create
   */
  findAtPosition (position:string, create?:boolean, added?:AtomicChange): any {
    const path=position.split ('/');
    if (this.content == null) {
      if( create) {
        this.content = {
          creation: {}
        };
        if (added) {
          added = added.createSubChange (ChangeType.ADD, 'creation');
        }
      } else {
        return null;
      }
    }

    let current = this.content;
    let currentPath= "";

    path.forEach(element => {
      if( (element==="") || (current===null))
        return current;
      if (currentPath.length === 0)
        currentPath = element;
      else
        currentPath = currentPath + '/' + element;
      if (! current[element]) {
        if (create) {
          current[element]={};
          if( added) {
            added = added.createSubChange(ChangeType.ADD, element);
          }
        } else
        {
          current=null;
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
   * @param if the jsonPath contains a placeholder, it's value is given here
   * @param position: in case the jsonPath is relative
   */
  queryModelToArray (query: string, position?: string): Array<any> {
    let root = this.content;
    if (position) {
      root = this.findAtPosition(position, false);
    }
    const result = JSONPath({path:query, json:root, resultType: "value", wrap:false, flatten:true});
    return result;
  }

  /**
   * Enable querying the model for any value, following jsonPath model
   * To use when potentially you expect a single value.
   * @param query: the query as a  jsonPath
   * @param position: in case the jsonPath is relative
   */
  queryModelToSingle (query: string, position?:string): any {
    let root = this.content;
    if (position) {
      root = this.findAtPosition(position, false);
    }
    const result = JSONPath({path:query, json:root, resultType: "value", wrap:false});
    if (Array.isArray(result)) {
      if( result.length<=1)
        return result[0];
      else throw new Error ("Mulitple results returned by queryModelToSingle with path "+query);
    }
    return result;
  }

  findAllPossibleTargetsOfProperty(property: string, position: string, schemaItem?:DontCodeSchemaItem): Array<any> {
    if( !schemaItem) {
      const ptr = this.schemaMgr.generateSchemaPointer(position);
      schemaItem = this.schemaMgr.locateItem(ptr.subPropertyPointer(property).positionInSchema, true);
    }
    const targetPath = schemaItem?.getTargetPath();
    if ((schemaItem) && (targetPath)) {
      const lastDotPos = targetPath.lastIndexOf('.');
      return this.queryModelToArray(targetPath.substring(0, lastDotPos)+'.*');
    }
    else {
      throw new Error("No Schema or no format definition for "+position+'/'+property);
    }
  }

  findTargetOfProperty(property: string, position: string, schemaItem?:DontCodeSchemaItem): any {
    const src = this.findAtPosition(position, false);
    if ((src) && (src[property])) {
      if( !schemaItem) {
        const ptr = this.schemaMgr.generateSchemaPointer(position);
        schemaItem = this.schemaMgr.locateItem(ptr.subPropertyPointer(property).positionInSchema, true);
      }
      const targetPath = schemaItem?.getTargetPath();
      if ((schemaItem)&&(targetPath)) {
        const lastDotPos = targetPath.lastIndexOf('.');
//        const filteredQuery = targetPath.substring(0, lastDotPos)+'[?(@.'+targetPath.substring(lastDotPos+1)+'==="'+src[property]+'")]';
        const filteredQuery = targetPath.substring(0, lastDotPos)+'[?(@[\''+targetPath.substring(lastDotPos+1)+'\']==="'+src[property]+'")]';
        return this.queryModelToSingle(filteredQuery);
      } else {
        throw new Error("No Schema or no format definition for "+position+'/'+property);
      }
    }
    return undefined;
  }

  /**
   * Did one of the change add a direct subelement of the one in position ? If yes, then we assume the element at position has changed
   * @param toCheck
   * @param changes
   * @private
   */
  protected hasAffected(toCheck: DontCodeModelPointer, changes: Change[]): boolean {
    for (let i=0;i<changes.length;i++) {
      const change = changes[i];
      if (change.type!==ChangeType.UPDATE) {
          // If the n-1 last / is the same as the lastSlash then the element is a direct subElement
        if (change.pointer?.isSubItemOf(toCheck)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Insert a property at the end of an object or before the specified property
   * @param parent
   * @param propName
   * @param value
   * @param beforeProp
   */
  insertProperty (parent: any, propName:string, value:any, beforeProp?:string) {
    if (beforeProp) {
        // Reinsert all properties of the object and inject the new one at the right order
      const keys = Object.keys(parent);
      for (const key of keys) {
        const copy = parent[key];
        delete parent[key];
        if (key === beforeProp) {
          parent[propName] = value;
        }
        parent[key] = copy;
      }
    } else {
      parent[propName] = value;
    }

  }

}

class AtomicChange {
  type!:ChangeType;
  name = "";
  subChanges = new Array <AtomicChange>();
  isRoot = false;
  oldPosition: string|undefined;

  constructor(type?:ChangeType, name?:string, oldPosition?:string) {
    if (type)
      this.type = type;
    if (name)
      this.name = name;
    this.oldPosition = oldPosition;
  }

  createSubChange(type: ChangeType|undefined, elementName: string, oldPosition?:string):AtomicChange {
    const newChange = new AtomicChange(type, elementName, oldPosition);
    this.subChanges.push(newChange);
    return newChange;
  }
}
