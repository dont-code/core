import * as DontCode from './globals';
import { DontCodeSchemaManager } from './model/dont-code-schema-manager';
import { DontCodePluginManager } from './plugin/dont-code-plugin-manager';
import { DontCodePreviewManager } from './plugin/preview/dont-code-preview-manager';
import { DontCodeStoreManager } from './store/dont-code-store-manager';
import { DontCodeModelManager } from './model/dont-code-model-manager';
import {DontCodeChangeManager} from "./change/dont-code-change-manager";

export class DontCodeCore implements DontCode.Core {
  protected schemaManager!: DontCodeSchemaManager;
  protected pluginManager!: DontCodePluginManager;
  protected previewManager!: DontCodePreviewManager;
  protected storeManager!: DontCodeStoreManager;
  protected modelManager!: DontCodeModelManager;
  protected changeManager!: DontCodeChangeManager;

  constructor() {
    console.debug("Init core");
    this.reset();
  }

  reset(): DontCode.Core {
    this.schemaManager = new DontCodeSchemaManager();
    this.pluginManager = new DontCodePluginManager();
    this.previewManager = new DontCodePreviewManager();
    this.modelManager = new DontCodeModelManager(this.schemaManager);
    this.changeManager = new DontCodeChangeManager(this.schemaManager, this.modelManager);
    this.storeManager = new DontCodeStoreManager(this.modelManager);
    return this;
  }

  registerPlugin(plugin: DontCode.Plugin): void {
    this.pluginManager.registerPlugin(
      plugin,
      this.schemaManager,
      this.previewManager
    );
  }

  initPlugins (): void {
    this.pluginManager.initPlugins (this);
  }

  getSchemaUri(): string {
    return 'schemas/v1/dont-code-schema.json';
  }

  /**
   * Returns the schema of dont-code augmented by plugins
   */
  getSchemaManager(): DontCodeSchemaManager {
    return this.schemaManager;
  }

  getPreviewManager(): DontCodePreviewManager {
    return this.previewManager;
  }

  getStoreManager(): DontCodeStoreManager {
    return this.storeManager;
  }

  getModelManager(): DontCodeModelManager {
    return this.modelManager;
  }

  getChangeManager(): DontCodeChangeManager {
    return this.changeManager;
  }

}
