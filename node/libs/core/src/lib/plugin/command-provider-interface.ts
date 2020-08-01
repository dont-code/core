import { Observable } from "rxjs";
import { Change } from "../change/change";

export interface CommandProviderInterface {
  receiveCommands (position?: string, lastItem?: string): Observable<Change>;

}
