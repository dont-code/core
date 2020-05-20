import { DontCode } from "./globals";
import { DontCodeSchemaManager } from "./model/dont-code-schema-manager";
import { DontCodePluginManager } from "./model/dont-code-plugin-manager";

export class DontCodeCore implements DontCode.Core {

    protected schemaManager:DontCodeSchemaManager;
    protected pluginManager:DontCodePluginManager;

    constructor() {
      this.schemaManager = new DontCodeSchemaManager();
      this.pluginManager = new DontCodePluginManager();
    }

    registerPlugin(plugin: DontCode.Plugin): void {
      this.pluginManager.registerPlugin (plugin, this.schemaManager);
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

}

