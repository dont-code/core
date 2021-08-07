import {Observable} from 'rxjs';
import {DontCodeStoreProvider} from "./dont-code-store-provider";

export class DontCodeStoreManager {

  private _default?: DontCodeStoreProvider;


  constructor(provider?:DontCodeStoreProvider) {
    this._default = provider;
  }


  getProvider(): DontCodeStoreProvider|undefined {
    return this._default;
  }

  getProviderSafe(): DontCodeStoreProvider {
    if (this._default) {
      return this._default;
    }else {
      throw new Error ('Trying to get an undefined or null provider');
    }
  }

  setProvider(value: DontCodeStoreProvider) {
    this._default = value;
  }

  storeEntity (position:string, entity:any) : Promise<any> {

    return this.getProviderSafe().storeEntity(position, entity);
  }

  loadEntity (position:string, key: any) : Promise<any> {
    return this.getProviderSafe().loadEntity(position, key);
  }

  deleteEntity (position:string, key:any): Promise<boolean> {
    return this.getProviderSafe().deleteEntity(position, key);
  }

  searchEntities (position:string, ...criteria:DontCodeStoreCriteria[]): Observable<Array<any>> {
    return this.getProviderSafe().searchEntities(position, ...criteria);
  }

  canStoreDocument (position?:string): boolean {
    const res= this.getProvider()?.canStoreDocument(position);
    if( res) return res;
    else return false;
  }

  storeDocuments (toStore:File[], position?:string): Observable<UploadedDocumentInfo> {
    return this.getProviderSafe().storeDocuments(toStore, position);
  }

}

export type UploadedDocumentInfo = {
  documentName:string;
  isUrl:boolean;
  documentId?:string;
}


export enum DontCodeStoreCriteriaOperator {
  EQUALS= '=',
  LESS_THAN = '<',
  LESS_THAN_EQUAL = '<='
}

export class DontCodeStoreCriteria {
  name:string;
  value: any;
  operator: DontCodeStoreCriteriaOperator;


  constructor(name: string, value: any, operator?: DontCodeStoreCriteriaOperator) {
    this.name = name;
    this.value = value;
    if (!operator)
      this.operator = DontCodeStoreCriteriaOperator.EQUALS;
    else {
      this.operator = operator;
    }
  }
}
