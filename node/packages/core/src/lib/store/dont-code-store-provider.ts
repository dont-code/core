import {Observable} from 'rxjs';
import {DontCodeStoreCriteria, DontCodeStoreCriteriaOperator, UploadedDocumentInfo} from './dont-code-store-manager';

/**
 * The standard interface for any store provider
 */
export interface DontCodeStoreProvider {
  storeEntity(position: string, entity: any): Promise<any>;

  loadEntity(position: string, key: any): Promise<any>;

  deleteEntity(position: string, key: any): Promise<boolean>;

  searchEntities(
    position: string,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<Array<any>>;

  canStoreDocument(position?: string): boolean;

  /**
   * Upload documents to a server store and returns the url or the id needed to retrieve them.
   * @param toStore
   */
  storeDocuments(
    toStore: File[],
    position?: string
  ): Observable<UploadedDocumentInfo>;
}

export abstract class AbstractDontCodeStoreProvider implements DontCodeStoreProvider {
  abstract canStoreDocument(position?: string): boolean;

  abstract deleteEntity(position: string, key: any): Promise<boolean>;

  abstract loadEntity(position: string, key: any): Promise<any>;

  abstract searchEntities(position: string, ...criteria: DontCodeStoreCriteria[]): Observable<Array<any>>;

  abstract storeDocuments(toStore: File[], position?: string): Observable<UploadedDocumentInfo>;

  abstract storeEntity(position: string, entity: any): Promise<any>;

  /**
   * In case the provider source doesn't support search criteria, they can be applied here
   * @param list
   * @param criteria
   */
  applyFilters (list:Array<any>, ...criteria: DontCodeStoreCriteria[]): Array<any> {
    if ((criteria==null)||(criteria.length==0)) return list;
    return list.filter(element => {
      for (const criterium of criteria) {
        const toTest = element[criterium.name];
        switch (criterium.operator) {
          case DontCodeStoreCriteriaOperator.EQUALS:
            return criterium.value==toTest;
          case DontCodeStoreCriteriaOperator.LESS_THAN:
            return toTest < criterium.value;
          case DontCodeStoreCriteriaOperator.LESS_THAN_EQUAL:
            return toTest <= criterium.value;
          default:
            throw new Error ("Operator "+criterium.operator+" unknown");
        }
      }
      return true;
    });
    return list;
  }

}
