import {Action} from "../action/action";

/**
 * Defines how an action handler can act on data
 */
export interface ActionHandler {

  /**
   * Performs an action given the scope, the position in the meta-model, the action name and the data
   * These actions do not return any data
   * @param action
   */
  performAction (action: Action):Promise<void>;
}

/**
 * Helper in case you have synchronous action only and you don't want to manage promises
 */
export abstract class AbstractActionHandler implements ActionHandler {

  performAction(action: Action): Promise<void> {
    return new Promise(() => {
      this.performSynchronousAction(action);
    });
  }

  performSynchronousAction (action:Action): void {
    // To be implemented
    throw new Error ("Action "+action+" for "+action.context.valueOf()+" at "+action.position+" not implemented yet");
  }
}
