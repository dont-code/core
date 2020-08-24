import { DontCode, DontCodeSchemaItem } from "@dontcode/core";
import PreviewHandlerConfig = DontCode.PreviewHandlerConfig;

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
          if (jsonContent) {
            if (configuration.location.values) {
              const jsonValue=jsonContent[configuration.location.id] as string;

              (configuration.location.values as Array<string>).forEach (targetValue => {
                if( targetValue === jsonValue) {
                  ret = configuration;
                  return;
                }
              })
            }
          } else {
            if (!configuration.location.values) {
              ret = configuration;
              return;
            }
          }
        })
      }
    return ret;
  }
}
