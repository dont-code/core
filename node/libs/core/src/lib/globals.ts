import { DontCodeCore } from "./dontcode";

export namespace DontCode {
  export var dtcde: DontCode.Core = new DontCodeCore();

  export interface Core {
    getSchemaUri (): string;
    registerPlugin (plugin:Plugin): void;
  }

  export interface Plugin {
    updatesToModel (): any ;
  }

}

export {};
