import { DontCodeSchemaManager } from "./dont-code-schema-manager";
import { DontCode } from "../globals";
import PluginConfig = DontCode.PluginConfig;

export class DontCodePluginManager {

  protected plugins:Map<string,DontCode.Plugin>=new Map();

  constructor() {
  }

  registerPlugin(plugin: DontCode.Plugin, schemaManager: DontCodeSchemaManager) {
    const config:PluginConfig = plugin.updatesToModel();
    const fullId = config.plugin.id+'-v'+config.plugin.version;
    this.plugins.set(fullId, plugin);

    schemaManager.registerChanges (config);
  }

}
