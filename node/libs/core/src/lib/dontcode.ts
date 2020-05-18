import { DontCode } from "./globals";
import { DontCodeSchemaManager } from "./model/dont-code-schema-manager";

export class DontCodeCore implements DontCode.Core {

    protected schemaManager:DontCodeSchemaManager;

    constructor() {
      this.schemaManager = new DontCodeSchemaManager();
    }

    registerPlugin(plugin: DontCode.Plugin): void {
        //throw new Error("Method not implemented.");
      console.log("Plugin registered", plugin);
    }

    getSchemaUri(): string {
      return "schemas/dont-code-schema.json";
    }

  /**
   * Returns the schema of dont-code augmented by plugins
   */
  getSchemaManager (): DontCodeSchemaManager {
      return this.schemaManager;
    }

}

