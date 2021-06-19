import * as DontCode from "@dontcode/core";
import {PreviewHandlerConfig} from "@dontcode/core";

export class DontCodePreviewManager {
  protected handlersPerLocations: Map<string, PreviewHandlerConfig[] >


  constructor() {
    this.handlersPerLocations = new Map<string, DontCode.PreviewHandlerConfig[]>();
  }

  registerHandlers (config: DontCode.PluginConfig): void {
    if (config["preview-handlers"]) {
      config["preview-handlers"].forEach(value => {
        if (this.handlersPerLocations.has(value.location.parent)) {
          this.handlersPerLocations.get(value.location.parent).push(value);
        }
        else {
          this.handlersPerLocations.set(value.location.parent, [value]);
        }
      });
    }
  }

  retrieveHandlerConfig (position: string, jsonContent?: any): PreviewHandlerConfig {
    const found = this.handlersPerLocations.get(position);
    let ret:PreviewHandlerConfig = null;

    if (found) {
        found.forEach (configuration => {
          if (configuration.location.values) {
            if (jsonContent) {
              const jsonValue=jsonContent[configuration.location.id] as string;

              (configuration.location.values as Array<string>).forEach (targetValue => {
                if( targetValue === jsonValue) {
                  ret = configuration;
                  return;
                }
              })
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
        const parentValue = {};
        parentValue[key] = jsonContent;
        return this.retrieveHandlerConfig(position.substring(0,position.lastIndexOf('/')),
          parentValue);
      }
    }
    return ret;
  }
}
