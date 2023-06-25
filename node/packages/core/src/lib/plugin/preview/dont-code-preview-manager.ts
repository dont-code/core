import {ActionHandlerConfig, ChangeHandlerConfig, PluginConfig} from '../../globals';
import { Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import {ActionHandler} from "../action-handler";

/**
 * Manages handlers that provides UI, calculation or action for data associated with an element.
 * It decodes "preview-handlers", "global-handlers", "action-handlers" from plugin-config.
 */
export class DontCodePreviewManager {
  protected handlersPerLocations!: Map<string, ChangeHandlerConfig[]>;
  protected globalHandlersPerLocations!: Map<string, ChangeHandlerConfig[]>;
  protected actionHandlersPerLocation!: Map<{ position:string, context:string }, ActionHandlerConfig[]>;
  protected globalHandlers!: ReplaySubject<ChangeHandlerConfig>;

  constructor() {
    this.reset();
  }

  reset() {
    this.handlersPerLocations = new Map<string, ChangeHandlerConfig[]>();
    this.globalHandlersPerLocations = new Map<string, ChangeHandlerConfig[]>();
    this.actionHandlersPerLocation = new Map();
    this.globalHandlers = new ReplaySubject();
  }

  registerHandlers(config: PluginConfig): void {
    if (config['preview-handlers']) {
      config['preview-handlers'].forEach((value) => {
        let array = this.handlersPerLocations.get(value.location.parent);
        if (!array) {
          array = new Array<ChangeHandlerConfig>();
          this.handlersPerLocations.set(value.location.parent, array);
        }
        array.push(value);
      });
    }
    if (config['global-handlers']) {
      config['global-handlers'].forEach((value) => {
        let array = this.handlersPerLocations.get(value.location.parent);
        if (!array) {
          array = new Array<ChangeHandlerConfig>();
          this.handlersPerLocations.set(value.location.parent, array);
        }
        array.push(value);
        // Update the global handlers as well
        array = this.globalHandlersPerLocations.get(value.location.parent);
        if (!array) {
          array = new Array<ChangeHandlerConfig>();
          this.globalHandlersPerLocations.set(value.location.parent, array);
        }
        array.push(value);
        this.globalHandlers.next(value);
      });
    }
    if (config['action-handlers']) {
      for (const value of config['action-handlers']) {
        let array = this.actionHandlersPerLocation.get({position:value.location.parent, context:value["action-context"]});
        if (!array) {
          array = new Array<ActionHandlerConfig>();
          this.actionHandlersPerLocation.set({position:value.location.parent, context:value["action-context"]}, array);
        }
        array.push(value);

      }
    }
  }

  getGlobalHandlers(): Map<string, Array<ChangeHandlerConfig>> {
    return this.globalHandlersPerLocations;
  }

  receiveGlobalHandlers(): Observable<ChangeHandlerConfig> {
    return this.globalHandlers;
  }

  retrieveHandlerConfig(
    position: string,
    modelContent?: any
  ): ChangeHandlerConfig | null {
    const found = this.handlersPerLocations.get(position);
    let ret: ChangeHandlerConfig | null = null;
    let contentNeeded = false;

    if (found) {
      for (const configuration of found) {
        if (configuration.location.values) {
          if (modelContent) {
            let jsonValue = modelContent as string;
            if (configuration.location.id)
              jsonValue = modelContent[configuration.location.id];

            this.extractValuesAsArray(configuration.location.values).forEach(
              (targetValue) => {
                if (targetValue === jsonValue) {
                  ret = configuration;
                  return;
                }
              }
            );
          } else {
            // We found one handler that needs the jsonContent
            contentNeeded = true;
          }
        } else {
          // We have found a default handler, we keep it but keep on looking for a better one
          if (ret === null) {
            ret = configuration;
          }
        }
      }
    } else {
      // Try to see if the parent position is handled
      if (typeof modelContent === 'string' && position.lastIndexOf('/') > 0) {
        if (position.endsWith('/'))
          position = position.substring(0, position.length - 1);

        const key = position.substring(position.lastIndexOf('/') + 1);
        const parentValue: { [index: string]: string } = {};
        parentValue[key] = modelContent;
        return this.retrieveHandlerConfig(
          position.substring(0, position.lastIndexOf('/')),
          parentValue
        );
      }
    }

    if (ret === null && contentNeeded) {
      // We had one potential handler but couldn't select it as the jsonContent is not provided
      throw new Error(
        'Content must be provided in order to select an handler for position ' +
          position
      );
    }
    return ret;
  }

  /**
   * Returns all the action handlers for a given position in the model and for a given context.
   * @param position
   * @param context
   * @param modelContent
   */
  retrieveActionHandlers(    position: string, context:string, modelContent?: any ): ActionHandlerConfig[] {
    const ret= this.actionHandlersPerLocation.get({position, context});
    if( ret==null)
      return [];
    else
      return ret;
  }

  private extractValuesAsArray(values: any): Array<string> {
    const ret = new Array<string>();
    this.extractValuesToArray(values, ret);
    return ret;
  }

  private extractValuesToArray(values: any, res: Array<string>) {
    if (Array.isArray(values)) {
      (values as Array<string>).forEach((value) => {
        if (typeof value === 'string') {
          res.push(value);
        } else {
          this.extractValuesToArray(value, res);
        }
      });
    } else {
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          this.extractValuesToArray(values[key], res);
        }
      }
    }
  }
}
