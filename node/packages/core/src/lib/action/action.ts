import {Change, ChangeType} from "../change/change";
import {ActionContextType, ActionType} from "../globals";
import {DontCodeModelPointer} from "../model/dont-code-schema";
import {Observable, Subject} from "rxjs";
import {run} from "jest";

/**
 * An action is a special type of change where we ask the handler to act on data.
 */
export class Action extends Change {
  context: ActionContextType;
  actionType:ActionType;
  running: Subject<Promise<void>> | null = new Subject<Promise<void>>();

  constructor(
                  position: string,
                  value: any,
                  context: ActionContextType,
                  actionType:ActionType,
                  pointer?: DontCodeModelPointer,
                  running?:Subject<Promise<void>>|null,
                  changeType?:ChangeType
) {
    super(changeType??ChangeType.ACTION,position, value,pointer);
    this.context=context;
    this.actionType=actionType;
    if( running!=null) this.running=running;
  }
}
