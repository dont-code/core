/**
 * Defines how an action handler can act on data
 */
export interface ActionHandler {

  /**
   * Performs an action given the scope, the position in the meta-model, the action name and the data
   * These actions do not returns any data
   * @param scope
   * @param position
   * @param action
   * @param data
   */
  performAction (scope:string, position:string, action:string, data:undefined):Promise<void>;
}

export abstract class AbstractActionHandler implements ActionHandler {

  performAction(scope: string, position: string, action: string, data: undefined): Promise<void> {
    return new Promise(() => {
      this.performSynchronousAction(scope, position, action, data);
    });
  }

  performSynchronousAction (scope: string, position: string, action: string, data: undefined): void {
    // To be implemented
    throw new Error ("Action "+action+" for "+scope+" at "+position+" not implemented yet");
  }
}
