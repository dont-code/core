import {DontCodeSchemaManager} from '../model/dont-code-schema-manager';
import * as DontCode from '../globals';
import {DontCodePreviewManager} from './preview/dont-code-preview-manager';
import PluginConfig = DontCode.PluginConfig;

export class DontCodePluginManager {
  protected plugins: Map<string, PluginInfo> = new Map();

  registerPlugin(
    plugin: DontCode.Plugin,
    schemaManager: DontCodeSchemaManager,
    previewManager: DontCodePreviewManager
  ) {
    const config: PluginConfig = plugin.getConfiguration();
    const fullId = config.plugin.id + '-v' + config.plugin.version;

    console.debug ("Setting up", fullId);
    schemaManager.registerChanges(config);
    previewManager.registerHandlers(config);

    this.plugins.set(fullId, new PluginInfo (plugin));
  }

  initPlugins (core:DontCode.Core): void {
    this.plugins.forEach(plugin => {
      if (plugin.initCalled===false) {
        try {
            // Initialize the change of model
          const defs = plugin.plugin.getConfiguration()?.["definition-updates"];
          core.getChangeManager().applyPluginConfigUpdates(defs);
          plugin.plugin.pluginInit(core);
          plugin.initCalled=true;
        } catch (error) {
          console.error("Error calling "+plugin.plugin+" init method:", error);
        }
      }
    });
  }
}

class PluginInfo {
  plugin: DontCode.Plugin;
  initCalled:boolean;

  constructor(plugin: DontCode.Plugin, initCalled?: boolean) {
    this.plugin=plugin;
    if (initCalled==null)
      this.initCalled=false;
    else
      this.initCalled=initCalled;
  }
}
