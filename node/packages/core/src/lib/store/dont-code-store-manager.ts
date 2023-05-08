import {Observable} from 'rxjs';
import {DontCodeStoreProvider,} from './dont-code-store-provider';
import {DontCodeModelManager} from '../model/dont-code-model-manager';
import {DontCodeSourceType} from '../globals';
import {DontCodeModel} from '../model/dont-code-model';

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

export class DontCodeStoreSort {

  constructor(public name: string, public direction?:DontCodeStoreSortDirection, public subSort?:DontCodeStoreSort) {
    if (direction==null)   this.direction=DontCodeStoreSortDirection.NONE;
  }
}

export class DontCodeStoreGroupby {
  constructor(public name:string, public aggregates?:DontCodeStoreAggregate[]) {
  }

  public atLeastOneGroupIsRequested (): boolean {
    if( this.aggregates!=null) {
      for (const groupedValue of this.aggregates) {
        if (groupedValue.calculation!=DontCodeStoreCalculus.NONE)
          return true;
      }
    }
    return false;
  }

  getRequiredListOfFields(): Set<string> {
    const ret = new Set<string>();
    if( this.aggregates!=null) {
      for (const aggregate of this.aggregates) {
        if (aggregate.calculation!=DontCodeStoreCalculus.NONE) {
          ret.add(aggregate.name);
        }
      }
    }
    return ret;
  }
}

export class DontCodeStoreAggregate {
  constructor(public name:string, public calculation?:DontCodeStoreCalculus) {
    if (calculation==null) this.calculation=DontCodeStoreCalculus.NONE;
  }
}

export enum DontCodeStoreCalculus {
  NONE=0,
  SUM=1,
  AVERAGE=2,
  COUNT=3
}

export enum DontCodeStoreSortDirection {
  ASCENDING=1,
  DESCENDING=2,
  NONE=0
}
