import { DontCodeCore } from "./dontcode";
import { DontCodeSchemaManager } from "./model/dont-code-schema-manager";
import { DontCodePreviewManager } from "./plugin/preview/dont-code-preview-manager";

export namespace DontCode {
  export var dtcde: DontCode.Core = new DontCodeCore();

  export interface Core {
    getSchemaUri (): string;
    registerPlugin (plugin:Plugin): void;
    getSchemaManager (): DontCodeSchemaManager;
    getPreviewManager (): DontCodePreviewManager;
  }

  export interface Plugin {
    getConfiguration (): PluginConfig ;
  }

  /**
   * The typescript equivalent of plugin-config-schema.json
   */
  export interface PluginConfig {
    plugin: {
      id,
      "display-name"?,
      "version"
    },
    "schema-updates"?: Array<
      {
        id,
        description,
        changes:Array <ChangeConfig>;
      }>,
    "preview-handlers"?: Array<PreviewHandlerConfig>
  }

  export interface ChangeConfig {
    location:{
      parent,
      id,
      after
    },
    add,
    props?,
    replace?:boolean

  }

  export interface PreviewHandlerConfig {
    location: {
      parent,
      id
    },
    class: {
      source,
      name
    }
  }
}

export {};
