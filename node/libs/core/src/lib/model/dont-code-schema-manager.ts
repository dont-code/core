import { DontCodeSchemaItem, DontCodeSchemaObject, DontCodeSchemaRoot } from "./dont-code-schema-item";
import { DontCodeSchema } from "./dont-code-schema";
import { DontCode } from "../globals";

export class DontCodeSchemaManager {
  protected currentSchema:DontCodeSchemaRoot;
  protected readSchema: any;

  constructor() {
    this.readSchema=DontCodeSchema.defaultv1;
    this.currentSchema = this.convertSchemaToMap (this.readSchema);
  }
  /**
   * Returns the current schema
   */
  getSchema (): DontCodeSchemaItem {
    return this.currentSchema;
  }

  private convertSchemaToMap(readSchema: any): DontCodeSchemaRoot {

    return new DontCodeSchemaRoot(readSchema);
  }

  registerChanges(config: DontCode.PluginConfig) {
    const pluginFullName = config.plugin.id+'-v'+config.plugin.version;
    if (config['schema-updates']) {
      const updates = config['schema-updates'];
      updates.forEach(update => {
        const changes = update.changes;
        changes.forEach(change => {
          const parent = this.locateItem (change.location.parent);
          if( parent) {
            parent.upsertWith(change);
          } else {
            throw ("Cannot find parent element: "+change.location.parent);
          }
        });
      });
    }
  }

  /**
   * Locate an item from it's position in the model
   * @param position
   */
  locateItem (position:string): DontCodeSchemaItem {
    const split = position.split('/');
    var cur:DontCodeSchemaItem = this.currentSchema;
    split.forEach(value => {
      if( !cur) {
        console.error('Could not find subItem '+value+' of '+position);
        return cur;
      }
      if( value && value.length>0 && value!=='#')
        cur = cur.getChild(value);
    });

    return cur;
  }

}
