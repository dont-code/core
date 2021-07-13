import * as DontCode from "@dontcode/core";
import {PreviewHandlerConfig} from "@dontcode/core";

export class DontCodePreviewManager {
  protected handlersPerLocations: Map<string, PreviewHandlerConfig[] >;


  constructor() {
    this.handlersPerLocations = new Map<string, DontCode.PreviewHandlerConfig[]>();
  }

  registerHandlers (config: DontCode.PluginConfig): void {
    if (config["preview-handlers"]) {
      config["preview-handlers"].forEach(value => {
        if (this.handlersPerLocations.has(value.location.parent)) {
          this.handlersPerLocations.get(value.location.parent)?.push(value);
        }
        else {
          this.handlersPerLocations.set(value.location.parent, [value]);
        }
      });
    }
  }

  retrieveHandlerConfig (position: string, jsonContent?: any): PreviewHandlerConfig|null {
    const found = this.handlersPerLocations.get(position);
    let ret:PreviewHandlerConfig|null = null;
    let contentNeeded=false;

    if (found) {
        found.forEach (configuration => {
          if (configuration.location.values) {
            if (jsonContent) {
              const jsonValue=jsonContent[configuration.location.id] as string;

              this.extractValuesAsArray(configuration.location.values).forEach (targetValue => {
                if( targetValue === jsonValue) {
                  ret = configuration;
                  return;
                }
              })
            } else {
              // We found one handler that needs the jsonContent
              contentNeeded=true;
            }
          } else {
            // We have found a default handler, we keep it but keep on looking for a better one
            if (ret === null) {
              ret = configuration;
            }
          }
        })
      } else {
      // Try to see if the parent position is handled
      if ((typeof jsonContent === "string") && (position.lastIndexOf('/')>0)) {
        if( position.endsWith('/'))  position = position.substring(0, position.length-1);

        const key = position.substring(position.lastIndexOf('/')+1);
        const parentValue:{[index: string]:string} = {};
        parentValue[key] = jsonContent;
        return this.retrieveHandlerConfig(position.substring(0,position.lastIndexOf('/')),
          parentValue);
      }
    }

    if( (ret===null) && (contentNeeded)) {
        // We had one potential handler but couldn't select it as the jsonContent is not provided
      throw new Error ("Content must be provided in order to select an handler for position "+position);
    }
    return ret;
  }

  private extractValuesAsArray(values: any): Array<string> {
    const ret = new Array<string>();
    this.extractValuesToArray(values, ret);
    return ret;
  }

  private extractValuesToArray(values: any, res: Array<string>) {
    if( Array.isArray(values) ) {
      (values as Array<string>).forEach(value => {
        if( typeof value === 'string') {
          res.push(value);
        } else {
          this.extractValuesToArray(value, res);
        }
      })
    }
    else {
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          this.extractValuesToArray(values[key], res);
        }
      }
    }
  }
}
