import { Observable } from 'rxjs';
import {DontCodeStoreCriteria} from "./dont-code-store-manager";

/**
 * The standard interface for any store provider
 */
export interface DontCodeStoreProvider {

  storeEntity (position:string, entity:any) : Promise<any>;

  loadEntity (position:string, key: any) : Promise<any>;

  deleteEntity (position:string, key:any): Promise<boolean>;

  searchEntities (position:string, ...criteria:DontCodeStoreCriteria[]): Observable<Array<any>>;

}

