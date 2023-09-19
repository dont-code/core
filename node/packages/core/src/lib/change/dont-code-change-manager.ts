import {Observable, ReplaySubject, Subject, throwError} from "rxjs";
import {Change, ChangeType} from "./change";
import {DontCodeModelManager} from "../model/dont-code-model-manager";
import {DontCodeSchemaManager} from "../model/dont-code-schema-manager";
import {DefinitionUpdateConfig} from "../globals";
import {DontCodeModelPointer} from "../model/dont-code-schema";
import {Action} from "../action/action";

/**
 * Manages the impact of changes that modify the model.
 * Any element can listen to a change at any level of the model, and gets notified accordingly
 */
export class DontCodeChangeManager {

  protected receivedChanges!:Subject<Change>;

  protected listeners = new Map<
    { position: string; property?: string },
    Subject<Change>
    >();
  protected listenerCachePerPosition = new Map<
    string,
    Array<Subject<Change>>
    >();

  constructor(protected schemaManager:DontCodeSchemaManager,
              protected modelManager:DontCodeModelManager) {
    this.reset();
  }

  reset() {
    if (this.receivedChanges!=null)
      this.receivedChanges.complete();
    this.receivedChanges = new Subject<Change>();
    this.listeners.clear();
    this.listenerCachePerPosition.clear();
  }

  /**
   * Check if the change affects the given position
   * @param pos
   * @param change
   * @protected
   */
  protected isInterestedIn(
    position: string,
    property: string | undefined,
    change: Change
  ): boolean {
    let onlyLevel = false;
    if (position[position.length - 1] === '?') {
      onlyLevel = true;
      position = position.substring(0, position.length - 1);
    }
    if (position[position.length - 1] === '/') {
      position = position.substring(0, position.length - 1);
    }
    //console.log("Setting Commands updates for ", position);
    //console.log("Filtering position for pos,item:", command.position, position, lastItem);
    if (change.position != null && change.position.startsWith(position)) {
      let nextPosition = DontCodeModelPointer.nextItemAndPosition(
        change.position,
        position.length + 1
      );
      const nextItem = nextPosition.value;
      if (property) {
        if (nextItem === property) {
          //console.log("Filtering ok");
          return true;
        } else {
          // Supports for listeners like "creation/entities", with "name" property that are in fact "creation/entities/xxanyEntityIDxx", with "name" property
          nextPosition = DontCodeModelPointer.nextItemAndPosition(
            change.position,
            nextPosition.pos + 1
          );
          if (nextPosition.value === property) {
            return true;
          }
        }
        //console.log("Filtering no");
        return false;
      } else if (onlyLevel) {
        //console.log("Filtering ok");
        if (nextItem != null) {
          // Check if its the last item
          nextPosition = DontCodeModelPointer.nextItemAndPosition(
            change.position,
            nextPosition.pos + 1
          );
          if (nextPosition.value === '') return true;
        }
        return false;
      } else {
        return true;
      }
    } else {
      //console.log("Filtering no");
      return false;
    }
  }

  protected createNewListener(
    position: string,
    property?: string
  ): Observable<Change> {
    const key = { position, property };

    this.clearEmptyListeners ();
    let item = this.listeners.get(key);
    if (item == null) {
      item = new ReplaySubject<Change>(1);
      this.listeners.set(key, item);
      this.listenerCachePerPosition.clear();
    }

        // Someone was listening to the same element, so we need to send the initial Reset only to the new listener
    if (item.observed==true) {
      return throwError( () => new Error ("Several components listen to the same position {"+position+', '+property));
    }


    // In case the model already contains a value the listener is interested in, just call it already
    const cleanedPosition = this.cleanPosition(position);
    const existing = this.modelManager.findAtPosition(cleanedPosition, false);
    if (existing!=null) {
      let chg = new Change(ChangeType.RESET, cleanedPosition, existing, this.schemaManager.generateSchemaPointer(cleanedPosition));
      if (this.isInterestedIn(position, property, chg)) {
        item.next(chg);
      } else {
        // Try to find if a sub element works (in case the listener wants all changes inside an array, for example "creation/entities" and "name" property)
        if (property!=null) {
          for (const propKey in existing) {
            chg = new Change(ChangeType.RESET, cleanedPosition + '/' + propKey, existing[propKey], this.schemaManager.generateSchemaPointer(cleanedPosition + '/' + propKey));
            if (this.isInterestedIn(position, property, chg)) {
              item.next(chg);
            } else if ((property!=null)&&(existing[propKey][property]!=null)) {
              chg = new Change(ChangeType.RESET, cleanedPosition + '/' + propKey+'/'+property, existing[propKey][property], this.schemaManager.generateSchemaPointer(cleanedPosition + '/' + propKey+'/'+property));
              if (this.isInterestedIn(position, property, chg)) {
                item.next(chg);
              }
            }
          }
        }
      }
    }
    return item;
  }

  protected addToListenerCache(position: string, who: Subject<Change>) {
    let interesteds = this.listenerCachePerPosition.get(position);
    if (!interesteds) {
      interesteds = new Array<Subject<Change>>();
      this.listenerCachePerPosition.set(position, interesteds);
    }

    interesteds.push(who);
  }

  getJsonAt(position: string): any {
    return this.modelManager.findAtPosition(position, false);
  }

  /**
   * Adds to the model the updates of configuration defined by the plugin or by the repository
   * @param defs
   */
  applyPluginConfigUpdates (defs: DefinitionUpdateConfig[] | undefined):void {
    if (defs!=null) {
      for (const definition of defs) {
        this.pushChange(this.modelManager.convertToChange(definition));
      }
    }

  }

  /**
   * Updates the model by the change (by calling DontCodeModelManager.applyChange ()), and notifies all listeners of the modifications
   * @param change
   * @return true if at least one listener has been called
   */
  pushChange(change: Change): boolean {
    let ret=false;
    const subChanges = this.modelManager.applyChange(change);
    ret = this.manageChangeInternally(change);
    // Sends as well the subChanges induced by this change
    for (const subChange of subChanges) {
      if (
        subChange.type !== change.type ||
        subChange.position !== change.position
      ) {
        const otherRet=this.manageChangeInternally(subChange);
        ret = ret || otherRet;
      }
    }
    return ret;
  }

  manageChangeInternally(change: Change): boolean {
    if (!change.pointer) {
      change.pointer = this.calculatePointerFor(change.position);
    }
    this.receivedChanges.next(change);
    return this.findAndNotify(change, new Map<Subject<Change>, Array<string>>());
  }

  /**
   * Finds a listener that is interested in this change and notifies it.
   * @param change
   * @param alreadyCalled
   */
  findAndNotify(
    change: Change,
    alreadyCalled: Map<Subject<Change>, Array<string>>
  ): boolean {
    let ret=false;
    // First resolve the position and cache it
    if (!this.listenerCachePerPosition.get(change.position)) {
      this.listeners.forEach((value, key) => {
        if (this.isInterestedIn(key.position, key.property, change)) {
          this.addToListenerCache(change.position, value);
        }
      });
    }

      // Then call all listeners, but only once
    const affected = this.listenerCachePerPosition.get(change.position);
    if (affected!=null) {
      for (const subject of affected) {
        let canCall = true;
        const positions = alreadyCalled.get(subject);
        if (positions) {
          // Don't call twice the same listener for the same or parent position
          for (const position of positions) {
            if (change.position.startsWith(position)) {
              canCall = false;
            }
          }
        } else {
          alreadyCalled.set(subject, new Array<string>());
        }
        if (canCall) {
          ret=true;
          subject.next(change);
          alreadyCalled.get(subject)?.push(change.position);
        }
      }
    }
    return ret;
  }

  /**
   * Be notified when something changes in the model at the following position
   * for example:
   * position: /creation/screens, property: name will be notified of all name changes for all screens
   * position: /creation/screens, property: null will be notified of any change in any screen and subscreens
   * position: /creation/screens/a, property: null will be notified on changes in screen a and below
   * position: /creation/screens/?, property: null will be notified on changes in screen items (move, delete), and not below
   * position: null, property: null will be notified on all changes
   * @param position
   * @param property
   */
  receiveCommands(position?: string, property?: string): Observable<Change> {
    if (position) {
      return this.createNewListener(position, property);
    } else return this.receivedChanges;
  }

  getSchemaManager(): DontCodeSchemaManager {
    return this.schemaManager;
  }

  calculatePointerFor(position: string): DontCodeModelPointer {
    const ret = this.schemaManager.generateSchemaPointer(position);
    return ret;
  }

  close() {
    this.receivedChanges.complete();
  }

  /**
   * Removes ? or / from end of position
   * @param position
   * @private
   */
  private cleanPosition(position: string): string {
    position = position.endsWith('?')
      ? position.substring(0, position.length - 1)
      : position;
    position = position.endsWith('/')
      ? position.substring(0, position.length - 1)
      : position;
    return position;
  }

  protected clearEmptyListeners() {
    const toRemove=new Array<{position:string, property?:string}>
    for (const listener of this.listeners) {
      if( !listener[1].observed) {
        toRemove.push(listener[0]);
      }
    }

    for (const remove of toRemove) {
      this.listeners.delete(remove);
    }
  }
}
