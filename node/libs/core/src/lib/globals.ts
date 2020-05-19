import { DontCodeCore } from "./dontcode";
import { DontCodeSchemaManager } from "./model/dont-code-schema-manager";

export namespace DontCode {
  export var dtcde: DontCode.Core = new DontCodeCore();

  export interface Core {
    getSchemaUri (): string;
    registerPlugin (plugin:Plugin): void;
    getSchemaManager (): DontCodeSchemaManager;
  }

  export interface Plugin {
    getConfiguration (): PluginConfig ;
  }

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
      }>
  }

  export interface ChangeConfig {
    location:{
      parent,
      id,
      after
    },
    add,
    props,
    replace:boolean

  }

}

export {};
