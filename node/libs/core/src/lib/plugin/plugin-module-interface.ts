import { PreviewHandler } from "@dontcode/core";

export interface PluginModuleInterface {
  exposedPreviewHandlers (): Map<string, PreviewHandler>;
}
