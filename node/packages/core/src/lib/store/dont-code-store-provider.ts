import { Observable } from 'rxjs';
import {
  DontCodeStoreCriteria,
  UploadedDocumentInfo,
} from './dont-code-store-manager';
import { DontCodeSourceType } from '../globals';

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

export interface DontCodeStoreProviderWithConfig extends DontCodeStoreProvider {
  // Returns an instance of this DontCodeStoreProvider that supports the config.
  withConfig(config: DontCodeSourceType): DontCodeStoreProvider;
}
