import { DontCode } from "@dontcode/core";
import PreviewHandlerConfig = DontCode.PreviewHandlerConfig;

export class DontCodePreviewManager {
  protected handlersPerLocations: Map<string, PreviewHandlerConfig >


  constructor() {
    this.handlersPerLocations = new Map<string, DontCode.PreviewHandlerConfig>();
  }

  registerHandlers (config: DontCode.PluginConfig): void {
    if (config["preview-handlers"]) {
      config["preview-handlers"].forEach(value => {
        this.handlersPerLocations.set(value.location.parent, value);
      });
    }
  }

  retrieveHandlerConfig (position: string): PreviewHandlerConfig {
    return this.handlersPerLocations.get(position);
  }
}
