import { DontCodeCore } from "./dontcode";
import { DontCodeSchemaManager } from "./model/dont-code-schema-manager";
import { DontCodePreviewManager } from "./plugin/preview/dont-code-preview-manager";
import { DontCodeStoreManager } from "./store/dont-code-store-manager";
import {DontCodeModelManager} from "./model/dont-code-model-manager";

  export interface Core {
    getSchemaUri (): string;
    registerPlugin (plugin:Plugin): void;
    getSchemaManager (): DontCodeSchemaManager;
    getModelManager (): DontCodeModelManager;
    getPreviewManager (): DontCodePreviewManager;
    getStoreManager (): DontCodeStoreManager;
  }

  export const dtcde: Core = new DontCodeCore();

  export interface Plugin {
    getConfiguration (): PluginConfig ;
  }

  /**
   * The typescript equivalent of the dont-code-schema.json
   */
  export interface DontCodeSchemaType {
    creation: {
      type: string,
      name: string,
      entities?: Array<
      {
        name:string,
        fields?: Array<{
          name:string,
          type:string
        }>
      }
      >,
      screens?: Array<
      {
        name:string
      }
      >
    }
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
      id?,
      after?
    },
    add?,
    props?,
    replace?:boolean

  }

  export interface PreviewHandlerConfig {
    location: {
      parent,
      id?,
      values?
    },
    class: {
      source,
      name
    }
  }

export {};
