import { DontCodeSchemaItem, DontCodeSchemaRef, DontCodeSchemaRoot } from "./dont-code-schema-item";
import { DontCodeModelPointer, DontCodeSchema } from "./dont-code-schema";
import {PluginConfig} from "../globals";

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

  registerChanges(config: PluginConfig) {
    const pluginFullName = config.plugin.id+'-v'+config.plugin.version;
    if (config['schema-updates']) {
      const updates = config['schema-updates'];
      updates.forEach(update => {
        const changes = update.changes;
        changes.forEach(change => {
          if( change.location.id) {
            const parent = this.locateItem (change.location.parent);
            if( parent) {
              parent.upsertWith(change);
            } else {
              throw ("Cannot find parent element: "+change.location.parent);
            }
          }
        });
      });
    }
  }

  /**
   * Locate an item from it's position in the model
   * @param position
   * @param resolveReference true to resolve the last reference instead of returning a @DontCodeSchemaRef
   */
  locateItem (position:string, resolveReference?:boolean): DontCodeSchemaItem {
    const split = position.split('/');
    let cur: DontCodeSchemaItem = this.currentSchema;
    split.forEach(value => {
      if( !cur) {
        console.error('Could not find subItem '+value+' of '+position);
        return cur;
      }
      if( value && value.length>0 && value!=='#') {
        if (cur.isReference())
          cur=this.resolveReference(cur as DontCodeSchemaRef);
        cur = cur.getChild(value);
      }
    });

    if( (resolveReference) && (cur.isReference())) {
      cur = this.resolveReference(cur as DontCodeSchemaRef);
    }
    return cur;
  }

  resolveReference (ref:DontCodeSchemaRef): DontCodeSchemaItem {
    return this.locateItem(ref.getReference());
  }

  generateSchemaPointer (position: string) : DontCodeModelPointer {
    const ret = new DontCodeModelPointer(position, null,null,null,null,null);

    position = (position[0]==='/')?position.substring(1):position;
    const posElems = position.split('/');

    let parentItem = this.currentSchema as DontCodeSchemaItem;
    let ignoreNext = false;
    posElems.forEach(element => {
      if (!ignoreNext) {
        let nextItem = parentItem.getChild(element);
        if (nextItem!==null) {
          ret.itemId=null;
          ret.containerSchemaPosition=ret.schemaPosition;
          if( ret.schemaPosition!==null)
            ret.schemaPosition=ret.schemaPosition+'/'+element;
          else
            ret.schemaPosition = element;

          if (nextItem.isArray()) {
            ignoreNext = true;
          } else {
            ignoreNext = false;
          }

          if( nextItem.isReference())
            nextItem = this.resolveReference(nextItem as DontCodeSchemaRef);

          parentItem = nextItem;

        } else {
          // Cannot find the next item in the schema: Error in the url
          throw new Error('Cannot parse \''+position+'\' from the schema as '+element+' is not a child of '+parentItem.getRelativeId());
        }
      } else {
        ret.itemId=element;
        ignoreNext=false;
      }
    });

    ret.containerSchemaPosition=ret.schemaPosition.substring(0, ret.schemaPosition.lastIndexOf('/'));
    ret.containerPosition=ret.position.substring(0, ret.position.lastIndexOf('/'));
    if (ret.itemId===null)
      ret.key = posElems[posElems.length-1];

    return ret;
  }

  /**
   * Returns the pointer to the subElement of the given pointer. It checked whether the given propOrItemName is a property or an item
   * by looking at the schema
   * @param parent
   * @param propOrItemName
   */
  generateSubSchemaPointer (parent:DontCodeModelPointer, propOrItemName: string): DontCodeModelPointer {
    if (this.locateItem(parent.schemaPosition, true).getChild(propOrItemName)) {
      return parent.subPropertyPointer(propOrItemName);
    } else {
      return parent.subItemPointer(propOrItemName);
    }
  }
}
