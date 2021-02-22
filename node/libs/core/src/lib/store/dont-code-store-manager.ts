import { Observable } from 'rxjs';
import {DontCodeStoreProvider} from "./dont-code-store-provider";

export class DontCodeStoreManager {

  private _default: DontCodeStoreProvider;


  constructor(provider?:DontCodeStoreProvider) {
    this._default = provider;
  }


  getProvider(): DontCodeStoreProvider {
    return this._default;
  }

  setProvider(value: DontCodeStoreProvider) {
    this._default = value;
  }

  storeEntity (position:string, entity:any) : Promise<boolean> {
    return this._default.storeEntity(position, entity);
  }

  loadEntity (position:string, key: any) : Promise<any> {
    return this._default.loadEntity(position, key);
  }

  deleteEntity (position:string, key:any): Promise<boolean> {
    return this._default.deleteEntity(position, key);
  }

  searchEntities (position:string, ...criteria:DontCodeStoreCriteria[]): Observable<Array<any>> {
    return this._default.searchEntities(position, ...criteria);
  }

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
    this.operator = operator;
    if (!this.operator)
      this.operator = DontCodeStoreCriteriaOperator.EQUALS;
  }
}
