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
    updatesToModel (): any ;
  }

}

export {};
