import { Observable } from "rxjs";
import { Change } from "../change/change";
import { DontCodeSchemaManager } from "../model/dont-code-schema-manager";
import { DontCodeModelPointer } from "../model/dont-code-schema";

/**
 * Interface exposing multiple functions from dontcode core to the plugin
 */
export interface CommandProviderInterface {
  receiveCommands (position?: string, lastItem?: string): Observable<Change>;
  getJsonAt(position: string): any;
  getSchemaManager (): DontCodeSchemaManager;
  calculatePointerFor (position:string): DontCodeModelPointer;

}
