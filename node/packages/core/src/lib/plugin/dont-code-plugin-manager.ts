import {DontCodeSchemaManager} from '../model/dont-code-schema-manager';
import * as DontCode from '../globals';
import {DontCodePreviewManager} from './preview/dont-code-preview-manager';
import {Change, ChangeType} from "../change/change";
import PluginConfig = DontCode.PluginConfig;
import {DontCodeModelManager} from "../model/dont-code-model-manager";

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
          if (defs!=null) {
            defs.forEach( definition => {
              let ptr=core.getSchemaManager().generateSchemaPointer(definition.location.parent);
              const schemaItem = core.getSchemaManager().locateItem(ptr.positionInSchema, false);
              if( schemaItem.isArray()) {
                if ((definition.location.id==null) || (definition.location.id==='*')) {
                  // We must create a subelement
                  ptr = ptr.subItemPointer(core.getModelManager().generateNextKeyForPosition(ptr.position, true));
                } else {
                  ptr = ptr.subItemPointer(definition.location.id);
                }
              } else {
                if (definition.location.id!=null) {
                  ptr = ptr.subItemPointer(definition.location.id);
                }
              }
              core.getModelManager().applyChange(
                new Change(ChangeType.ADD, ptr.position, definition.update
                  ,ptr
                  ,definition.location.after));
            })
          }
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
