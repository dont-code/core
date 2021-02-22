import { DontCodeSchemaManager } from "../model/dont-code-schema-manager";
import { DontCode } from "../globals";
import PluginConfig = DontCode.PluginConfig;
import { DontCodePreviewManager } from "./preview/dont-code-preview-manager";

export class DontCodePluginManager {

  protected plugins:Map<string,DontCode.Plugin>=new Map();

  registerPlugin(plugin: DontCode.Plugin, schemaManager: DontCodeSchemaManager, previewManager:DontCodePreviewManager ) {
    const config:PluginConfig = plugin.getConfiguration();
    const fullId = config.plugin.id+'-v'+config.plugin.version;
    this.plugins.set(fullId, plugin);

    schemaManager.registerChanges (config);
    previewManager.registerHandlers (config);
  }

}
