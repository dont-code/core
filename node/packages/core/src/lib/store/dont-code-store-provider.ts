import {map, Observable} from 'rxjs';
import {
  DontCodeStoreCriteria,
  DontCodeStoreGroupby,
  DontCodeStoreSort,
  UploadedDocumentInfo
} from './dont-code-store-manager';
import {
  DontCodeStoreGroupedByEntities,
  DontCodeStorePreparedEntities,
  StoreProviderHelper
} from "./store-provider-helper";
import {DontCodeDataTransformer} from "./dont-code-data-transformer";
import { DontCodeModelManager } from '../model/dont-code-model-manager';

/**
 * The standard interface for any store provider
 */
export interface DontCodeStoreProvider<T=never> {
  storeEntity(position: string, entity: T): Promise<T>;

  /**
   * Rejects the promise if the entity is not found
   * @param position
   * @param key
   */
  safeLoadEntity(position: string, key: any): Promise<T>;
  loadEntity(position: string, key: any): Promise<T|undefined>;

  deleteEntity(position: string, key: any): Promise<boolean>;

  searchEntities(
    position: string,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<Array<T>>;

  searchAndPrepareEntities(
    position: string,
    sort?:DontCodeStoreSort,
    groupBy?:DontCodeStoreGroupby,
    transformer?: DontCodeDataTransformer<T>,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<DontCodeStorePreparedEntities<T>>;

  canStoreDocument(position?: string): boolean;

  /**
   * Upload documents to a server store and returns the url or the id needed to retrieve them.
   * @param toStore
   * @param position
   */
  storeDocuments(
    toStore: File[],
    position?: string
  ): Observable<UploadedDocumentInfo>;
}

export abstract class AbstractDontCodeStoreProvider<T=never> implements DontCodeStoreProvider<T> {
  abstract canStoreDocument(position?: string): boolean;

  abstract deleteEntity(position: string, key: any): Promise<boolean>;

  abstract loadEntity(position: string, key: any): Promise<T|undefined>;

  protected modelMgr?:DontCodeModelManager;
  
  constructor (modelMgr?:DontCodeModelManager) {
    this.modelMgr=modelMgr;
  }

  safeLoadEntity(position: string, key: any): Promise<T> {
    return this.loadEntity(position, key).then(value => {
      if (value==null)
        return Promise.reject("Not found");
      else return value;
    })
  }

  /**
   * If the store supports queries with criteria, this function must be implemented, if not, listEntities must be implemented, and this function will apply filters
   * @param position
   * @param criteria
   */
  searchEntities(position: string, ...criteria: DontCodeStoreCriteria[]): Observable<T[]> {
    return this.listEntities(position).pipe(
      map (value => {
        return StoreProviderHelper.applyFilters(value, ...criteria) as T[];
      })
    );
  }

  /**
   * Returns the list of entities at a given position in the model. Implements at least this function or searchEntities depending on the capability of the store
   * @param position
   * @protected
   */
  protected listEntities (position:string): Observable<T[]> {
    return this.searchEntities(position);
  }

  searchAndPrepareEntities(position: string, sort?: DontCodeStoreSort, groupBy?: DontCodeStoreGroupby, transformer?: DontCodeDataTransformer<T>, ...criteria: DontCodeStoreCriteria[]): Observable<DontCodeStorePreparedEntities<T>> {
    return this.searchEntities(position, ...criteria).pipe(
      map (value => {
        // Run the transformation if any
        if (transformer!=null) return transformer.postLoadingTransformation(value);
        else return value;
      }),
      map (value => {
        let groupedByValues:DontCodeStoreGroupedByEntities|undefined;
        if((sort!=null) || (groupBy?.atLeastOneGroupIsRequested()===true)) {
          value = StoreProviderHelper.multiSortArray(value, this.calculateSortHierarchy(sort, groupBy)) as T[];
          if (groupBy!=null) {
            groupedByValues = StoreProviderHelper.calculateGroupedByValues(value, groupBy, this.modelMgr);
          }
        }
        return new DontCodeStorePreparedEntities<T> (value, sort, groupedByValues);
      })
    );
  }

  abstract storeDocuments(toStore: File[], position?: string): Observable<UploadedDocumentInfo>;

  abstract storeEntity(position: string, entity: T): Promise<T>;


  protected calculateSortHierarchy(sort?: DontCodeStoreSort, groupBy?: DontCodeStoreGroupby ):DontCodeStoreSort|undefined {
    // We must first sort by the groupBy, and then by the sort
    let rootSort:DontCodeStoreSort|undefined;
    if (groupBy!=null) {
      rootSort=new DontCodeStoreSort(groupBy.of, undefined, sort);
    } else {
      rootSort=sort;
    }
    return rootSort;
  }

}
