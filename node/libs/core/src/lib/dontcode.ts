import * as DontCode from "./globals";
import {DontCodeSchemaManager} from "./model/dont-code-schema-manager";
import {DontCodePluginManager} from "./plugin/dont-code-plugin-manager";
import {DontCodePreviewManager} from "./plugin/preview/dont-code-preview-manager";
import {DontCodeStoreManager} from "./store/dont-code-store-manager";

export class DontCodeCore implements DontCode.Core {

    protected schemaManager:DontCodeSchemaManager;
    protected pluginManager:DontCodePluginManager;
    protected previewManager:DontCodePreviewManager;
    protected storeManager:DontCodeStoreManager;

    constructor() {
      this.schemaManager = new DontCodeSchemaManager();
      this.pluginManager = new DontCodePluginManager();
      this.previewManager = new DontCodePreviewManager();
      this.storeManager = new DontCodeStoreManager();
    }

    registerPlugin(plugin: DontCode.Plugin): void {
      this.pluginManager.registerPlugin (plugin, this.schemaManager, this.previewManager);
    }

    getSchemaUri(): string {
      return "schemas/v1/dont-code-schema.json";
    }

  /**
   * Returns the schema of dont-code augmented by plugins
   */
    getSchemaManager (): DontCodeSchemaManager {
      return this.schemaManager;
    }

    getPreviewManager (): DontCodePreviewManager {
      return this.previewManager;
    }

    getStoreManager (): DontCodeStoreManager {
      return this.storeManager;
    }
}

