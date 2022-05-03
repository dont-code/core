export interface PluginModuleInterface {
  /**
   * Lets the plugin describe the PreviewHandlers he's offering.
   * @return a Map of component name and class of component.
   */
  exposedPreviewHandlers(): Map<string, any>;
}
