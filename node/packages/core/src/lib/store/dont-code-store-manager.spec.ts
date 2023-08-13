import {
  DontCodeStoreCriteria,
  DontCodeStoreGroupby,
  DontCodeStoreSort,
  UploadedDocumentInfo
} from './dont-code-store-manager';
import {AbstractDontCodeStoreProvider} from './dont-code-store-provider';
import {dtcde} from '../dontcode';
import {Observable, of} from 'rxjs';
import {DontCodeStorePreparedEntities} from './store-provider-helper';
import {DontCodeDataTransformer} from "./dont-code-data-transformer";

describe('Store Manager', () => {
  it('should correctly return the default provider', () => {
    const storeManager = dtcde.getStoreManager();
    const defaultProvider = new DummyStoreProvider<never>();

    storeManager.setProvider(defaultProvider);
    expect(storeManager.getProvider() == defaultProvider).toBeTruthy();
    expect(storeManager.getDefaultProvider() == defaultProvider).toBeTruthy();
    expect(
      storeManager.getProvider('anyposition') == defaultProvider
    ).toBeTruthy();

    const newProvider = new DummyStoreProvider<never>();
    storeManager.setDefaultProvider(newProvider);
    expect(storeManager.getProvider() == newProvider).toBeTruthy();
    expect(storeManager.getDefaultProvider() == newProvider).toBeTruthy();
    expect(storeManager.getProvider('anyposition') == newProvider).toBeTruthy();

    storeManager.removeProvider();
    try {
      storeManager.getDefaultProviderSafe();
      expect(false).toBeTruthy();
    } catch (error) {
      // ok
    }
  });

  it('should correctly return other providers', () => {
    const storeManager = dtcde.getStoreManager();
    const defaultProvider = new DummyStoreProvider<never>();
    const testProvider = new DummyStoreProvider<never>();

    storeManager.setProvider(defaultProvider);
    storeManager.setProvider(testProvider, 'test/position');
    expect(storeManager.getDefaultProvider() == defaultProvider).toBeTruthy();
    expect(
      storeManager.getProvider('anyposition') == defaultProvider
    ).toBeTruthy();
    expect(
      storeManager.getProvider('test/position') == testProvider
    ).toBeTruthy();

    const newProvider = new DummyStoreProvider<never>();
    storeManager.setProvider(newProvider, 'test/position');
    expect(
      storeManager.getProvider('test/position') == newProvider
    ).toBeTruthy();

    storeManager.removeProvider('test/position');
    expect(
      storeManager.getProvider('test/position') == defaultProvider
    ).toBeTruthy();
  });
});

class DummyStoreProvider<T> extends AbstractDontCodeStoreProvider<T> {
  canStoreDocument(position?: string): boolean {
    return false;
  }

  deleteEntity(position: string, key: any): Promise<boolean> {
    return Promise.resolve(false);
  }

  loadEntity(position: string, key: any): Promise<T> {
    return Promise.reject();
  }

  searchEntities(
    position: string,
    ...criteria: DontCodeStoreCriteria[]
  ): Observable<Array<T>> {
    return of([]);
  }
  searchAndPrepareEntities(position: string, sort?: DontCodeStoreSort | undefined, groupBy?: DontCodeStoreGroupby | undefined, transformer?:DontCodeDataTransformer,...criteria: DontCodeStoreCriteria[]): Observable<DontCodeStorePreparedEntities<T>> {
    return of (new DontCodeStorePreparedEntities([]));
  }

  storeDocuments(
    toStore: File[],
    position?: string
  ): Observable<UploadedDocumentInfo> {
    return of({
      documentId:'areere',
      documentName: 'atgegtrgtr',
      isUrl: false
    });
  }

  storeEntity(position: string, entity: T): Promise<T> {
    return Promise.resolve(entity);
  }
}
