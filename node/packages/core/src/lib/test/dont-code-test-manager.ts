import {Change, ChangeType} from '../change/change';
import {DontCodeModelPointer} from '../model/dont-code-schema';
import {dtcde} from "../dontcode";
import {AbstractDontCodeStoreProvider} from "../store/dont-code-store-provider";
import {DontCodeStoreCriteria, UploadedDocumentInfo} from "../store/dont-code-store-manager";
import {from, Observable, Subject, take, takeUntil, throwError, timer} from "rxjs";

export class DontCodeTestManager {
  public static createDeleteChange(
    containerSchema: string,
    containerItemId: string | null,
    schema: string | null,
    itemId: string | null,
    property?: string
  ) {
    return DontCodeTestManager.createAnyChange(
      ChangeType.DELETE,
      containerSchema,
      containerItemId,
      schema,
      itemId,
      null,
      property
    );
  }

  public static createMoveChange(
    oldPosition: string,
    beforeIdOrProperty: string | null,
    containerSchema: string,
    containerItemId: string | null,
    schema: string,
    itemId: string | null,
    property?: string
  ) {
    const ret = DontCodeTestManager.createAnyChange(
      ChangeType.MOVE,
      containerSchema,
      containerItemId,
      schema,
      itemId,
      null,
      property
    );
    ret.oldPosition = oldPosition;
    if (beforeIdOrProperty) ret.beforeKey = beforeIdOrProperty;
    return ret;
  }

  public static createTestChange(
    containerSchema: string,
    containerItemId: string | null,
    schema: string | null,
    itemId: string | null,
    value: any,
    property?: string
  ) {
    return DontCodeTestManager.createAnyChange(
      ChangeType.ADD,
      containerSchema,
      containerItemId,
      schema,
      itemId,
      value,
      property
    );
  }

  /**
   * To help testing with pre-loaded data, you can add a storeprovider that will return the content of the file in the url
   * whenever called for the position;
   * @param position
   * @param toFetchAsset
   */
/*  public static addDummyProviderFromAsset (position:string, toFetchAsset: string): Promise<void> {
    return fetch(toFetchAsset).then(response => response.json()).then (content => {
        DontCodeTestManager.addDummyProviderFromContent( position, content);
    });
  }
*/

  /**
   * To help testing with pre-loaded data, you can add a storeprovider that will return the content of the file in the url
   * whenever called for the position;
   * @param position
   * @param toFetchAsset
   */
  public static addDummyProviderFromContent (position:string, toReturn: any): void {
    dtcde.getStoreManager().setProvider(new DummyStoreProvider<never> (toReturn), position);
  }

  /**
   * Wait until the tester function returns true. Ideal for ensuring tests wait an async result.
   * It will call done () if tester was true, or done("Timeout") if tester has always returned false
   * @param tester
   * @param Jest done() method equivalent
   * @param interval
   * @param maxTry
   */
  public static waitUntilTrue ( tester: () => boolean, done: (err?:string) => void, interval?:number, maxTry?:number ): void {
    interval = interval??50;
    maxTry=maxTry??50;

    const stop = new Subject();
    let stopped = false;

    timer(interval, interval).pipe(takeUntil(stop), take(maxTry)).subscribe({
      next: () => {
        if (tester()) {
          if( !stopped) {
            stopped=true;
            stop.next(true);
            done();
          }
        }
      },
      complete: () => {
        if (!stopped)
          done("Timeout");
      }
    });

  }

  public static createAnyChange(
    type: ChangeType,
    containerSchema: string,
    containerItemId: string | null,
    schema: string | null,
    itemId: string | null,
    value: any,
    property?: string
  ) {
    const calcContainerItemId = containerItemId ? '/' + containerItemId : '';
    const calcItemId = itemId ? '/' + itemId : '';
    let calcSchema = schema ? '/' + schema : '';
    if (containerSchema.length == 0) calcSchema = schema ? schema : '';
    let calcProperty = property ? '/' + property : '';
    if (containerSchema.length == 0 && calcSchema.length == 0)
      calcProperty = property ? property : '';
    const calcPropertySchemaItem = property
      ? calcSchema + calcItemId
      : itemId
      ? calcSchema
      : '';
    const calcPropertySchema = property ? calcSchema : '';

    return new Change(
      type,
      containerSchema +
        calcContainerItemId +
        calcSchema +
        calcItemId +
        calcProperty,
      value,
      new DontCodeModelPointer(
        containerSchema +
          calcContainerItemId +
          calcSchema +
          calcItemId +
          calcProperty,
        containerSchema + calcSchema + calcProperty,
        containerSchema + calcContainerItemId + calcPropertySchemaItem,
        containerSchema + calcPropertySchema,
        property ?? itemId ?? undefined,
        property != null
      )
    );
  }
}


/**
 * Helper that emulates a StoreProvider with predefined values
 */
class DummyStoreProvider<T> extends AbstractDontCodeStoreProvider<T> {

  content:any;

  constructor(content: any) {
    super();
    this.content = content;
  }

  canStoreDocument(position?: string): boolean {
    return false;
  }

  deleteEntity(position: string, key: any): Promise<boolean> {
    return Promise.reject("Not implemened by Dummy tester");
  }

  loadEntity(position: string, key: any): Promise<T> {
    if (this.content[key]!=null)
      return Promise.resolve(this.content[key]);
    return Promise.reject('Not found');
  }

  searchEntities(position: string, ...criteria: DontCodeStoreCriteria[]): Observable<Array<T>> {
    if (Array.isArray(this.content)) {
      return from([this.content]);
    } else {
      return from ([[this.content]]);
    }
  }

  storeDocuments(toStore: File[], position?: string): Observable<UploadedDocumentInfo> {
    return throwError(() => new Error ("Not implemented by Dummy tester"));
  }

  storeEntity(position: string, entity: T): Promise<T> {
    return Promise.reject("Not implemented by Dummy tester");
  }

}
