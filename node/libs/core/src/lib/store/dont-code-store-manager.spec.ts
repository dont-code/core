import {
  DontCodeSchemaObject,
  DontCodeSchemaRoot, DontCodeStoreCriteria,
  DontCodeStoreProvider,
  DontCodeTestManager,
  dtcde, UploadedDocumentInfo
} from "@dontcode/core";
import {Observable, of} from "rxjs";

describe('Store Manager', () => {
  it('should correctly return the default provider', () => {
    const storeManager = dtcde.getStoreManager();
    const defaultProvider = new DummyStoreProvider();

    storeManager.setProvider(defaultProvider);
    expect(storeManager.getProvider()==defaultProvider).toBeTruthy();
    expect(storeManager.getDefaultProvider()==defaultProvider).toBeTruthy();
    expect(storeManager.getProvider('anyposition')==defaultProvider).toBeTruthy();

    const newProvider = new DummyStoreProvider();
    storeManager.setDefaultProvider(newProvider);
    expect(storeManager.getProvider()==newProvider).toBeTruthy();
    expect(storeManager.getDefaultProvider()==newProvider).toBeTruthy();
    expect(storeManager.getProvider('anyposition')==newProvider).toBeTruthy();

    storeManager.removeProvider ();
    try {
      storeManager.getDefaultProviderSafe();
      expect(false).toBeTruthy();
    } catch (error) {
      // ok
    }

  });

  it('should correctly return other providers', () => {
    const storeManager = dtcde.getStoreManager();
    const defaultProvider = new DummyStoreProvider();
    const testProvider = new DummyStoreProvider();

    storeManager.setProvider(defaultProvider);
    storeManager.setProvider(testProvider, 'test/position');
    expect(storeManager.getDefaultProvider()==defaultProvider).toBeTruthy();
    expect(storeManager.getProvider('anyposition')==defaultProvider).toBeTruthy();
    expect(storeManager.getProvider('test/position')==testProvider).toBeTruthy();

    const newProvider = new DummyStoreProvider();
    storeManager.setProvider(newProvider, 'test/position');
    expect(storeManager.getProvider('test/position')==newProvider).toBeTruthy();

    storeManager.removeProvider ('test/position');
    expect(storeManager.getProvider('test/position')==defaultProvider).toBeTruthy();


  });

});

class DummyStoreProvider implements DontCodeStoreProvider {
  canStoreDocument(position?: string): boolean {
    return false;
  }

  deleteEntity(position: string, key: any): Promise<boolean> {
    return Promise.resolve(false);
  }

  loadEntity(position: string, key: any): Promise<any> {
    return Promise.resolve(undefined);
  }

  searchEntities(position: string, ...criteria: DontCodeStoreCriteria[]): Observable<Array<any>> {
    return of();
  }

  storeDocuments(toStore: File[], position?: string): Observable<UploadedDocumentInfo> {
    return of();
  }

  storeEntity(position: string, entity: any): Promise<any> {
    return Promise.resolve(undefined);
  }

}
