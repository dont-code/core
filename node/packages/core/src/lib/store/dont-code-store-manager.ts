import {Observable} from 'rxjs';
import {DontCodeStoreProvider,} from './dont-code-store-provider';
import {DontCodeModelManager} from '../model/dont-code-model-manager';
import {
  DontCodeReportGroupAggregateType,
  DontCodeGroupOperationType, DontCodeReportGroupType,
  DontCodeSortDirectionType, DontCodeReportSortType,
  DontCodeSourceType
} from '../globals';
import {DontCodeModel} from '../model/dont-code-model';
import {DontCodeStorePreparedEntities} from "./store-provider-helper";

export class DontCodeStoreManager {
  private _default?: DontCodeStoreProvider<never>;
  private providerByPosition = new Map<string, DontCodeStoreProvider<never>>();
  private providerByType = new Map<string, DontCodeStoreProvider<never>>();

  constructor(
    protected modelMgr: DontCodeModelManager,
    provider?: DontCodeStoreProvider<never>
  ) {
    this._default = provider;
    this.reset();
  }

  reset() {
    this.providerByPosition.clear();
    this.providerByType.clear();
  }

  getProvider<T>(position?: string): DontCodeStoreProvider<T> | undefined {
    if (position == null) {
      return this._default;
    } else {
      let ret = null;
      // Try to find if the entity is loaded from a defined source
      const srcDefinition = this.modelMgr.findTargetOfProperty(
        DontCodeModel.APP_ENTITIES_FROM_NODE,
        position
      )?.value as DontCodeSourceType;
      if (srcDefinition) {
        ret = this.providerByType.get(srcDefinition.type);
      }
      if (!ret) {
        ret = this.providerByPosition.get(position);
      }
      return ret ?? this._default;
    }
  }

  getProviderSafe<T>(position?: string): DontCodeStoreProvider<T> {
    const ret = this.getProvider<T>(position);
    if (ret == null) {
      throw new Error('Trying to get an undefined or null provider');
    } else {
      return ret;
    }
  }

  getDefaultProvider<T>(): DontCodeStoreProvider<T> | undefined {
    return this.getProvider();
  }

  getDefaultProviderSafe<T>(): DontCodeStoreProvider<T> {
    return this.getProviderSafe();
  }

  setProvider(value: DontCodeStoreProvider<never>, position?: string): void {
    if (position == null) this._default = value;
    else {
      this.providerByPosition.set(position, value);
    }
  }

  setProviderForSourceType(
    value: DontCodeStoreProvider<never>,
    srcType: string
  ): void {
    this.providerByType.set(srcType, value);
  }

  setDefaultProvider(value: DontCodeStoreProvider<never>): void {
    this.setProvider(value);
  }

  removeProvider(position?: string): void {
    if (position == null) this._default = undefined;
    else {
      this.providerByPosition.delete(position);
    }
  }

  removeProviderForSourceType(srcType: string): void {
    this.providerByType.delete(srcType);
  }

  removeDefaultProvider(): void {
    this.removeProvider();
  }

  storeEntity(position: string, entity: any): Promise<any> {
    return this.getProviderSafe(position).storeEntity(position, entity);
  }

  loadEntity(position: string, key: any): Promise<any> {
    return this.getProviderSafe(position).loadEntity(position, key);
  }

  deleteEntity(position: string, key: any): Promise<boolean> {
    return this.getProviderSafe(position).deleteEntity(position, key);
  }

  searchEntities(
    position: string,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<Array<any>> {
    return this.getProviderSafe(position).searchEntities(position, ...criteria);
  }

  searchAndPrepareEntities(
    position: string,
    sort?:DontCodeStoreSort,
    groupBy?:DontCodeStoreGroupby,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<DontCodeStorePreparedEntities<any>> {
    return this.getProviderSafe(position).searchAndPrepareEntities(position, sort, groupBy, ...criteria);
  }


  canStoreDocument(position?: string): boolean {
    const res = this.getProvider(position)?.canStoreDocument(position);
    if (res) return res;
    else return false;
  }

  storeDocuments(
    toStore: File[],
    position?: string
  ): Observable<UploadedDocumentInfo> {
    return this.getProviderSafe(position).storeDocuments(toStore, position);
  }

}

export type UploadedDocumentInfo = {
  documentName: string;
  isUrl: boolean;
  documentId?: string;
};

export enum DontCodeStoreCriteriaOperator {
  EQUALS = '=',
  LESS_THAN = '<',
  LESS_THAN_EQUAL = '<=',
}

export class DontCodeStoreCriteria {
  name: string;
  value: any;
  operator: DontCodeStoreCriteriaOperator;

  constructor(
    name: string,
    value: any,
    operator?: DontCodeStoreCriteriaOperator
  ) {
    this.name = name;
    this.value = value;
    if (!operator) this.operator = DontCodeStoreCriteriaOperator.EQUALS;
    else {
      this.operator = operator;
    }
  }
}

export class DontCodeStoreSort implements DontCodeReportSortType {

  direction: DontCodeSortDirectionType;

  constructor(public by: string, direction?:DontCodeSortDirectionType, public subSort?:DontCodeStoreSort) {
    if (direction==null)   this.direction=DontCodeSortDirectionType.None;
    else this.direction=direction;
  }
}

export class DontCodeStoreGroupby implements DontCodeReportGroupType {
  display:DontCodeStoreAggregate[];
  constructor(public of:string, display?:DontCodeStoreAggregate[]) {
    if (display==null) this.display=[];
    else this.display=display;
  }

  public atLeastOneGroupIsRequested (): boolean {
    if( (this.display!=null) && (this.display.length>0))
      return true;
    return false;
  }

  getRequiredListOfFields(): Set<string> {
    const ret = new Set<string>();
    if( this.display!=null) {
      for (const aggregate of this.display) {
        ret.add(aggregate.of);
      }
    }
    return ret;
  }
}

export class DontCodeStoreAggregate implements DontCodeReportGroupAggregateType{
  constructor(public of:string, public operation:DontCodeGroupOperationType) {
  }
}
