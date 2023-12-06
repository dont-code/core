import {
  DontCodeSchemaItem,
  DontCodeSchemaRef,
  DontCodeSchemaRoot,
} from './dont-code-schema-item';
import { DontCodeModelPointer, DontCodeSchema } from './dont-code-schema';
import { PluginConfig } from '../globals';

/**
 * Manages the schema used to describe an application in Dont-code.
 * A schema is provided by default, but can be updated by plugins.
 * That means plugins can add or modify new fields or entities thus changing the way applications are edited and described.
 */
export class DontCodeSchemaManager {
  protected currentSchema!: DontCodeSchemaRoot;
  protected readSchema: any;

  constructor() {
    this.reset();
  }
  /**
   * Returns the current schema
   */
  getSchema(): DontCodeSchemaItem {
    return this.currentSchema;
  }

  convertSchemaToMap(readSchema: any): DontCodeSchemaRoot {
    return new DontCodeSchemaRoot(readSchema);
  }

  registerChanges(config: PluginConfig) {
    const pluginFullName = config.plugin.id + '-v' + config.plugin.version;
    if (config['schema-updates']) {
      const updates = config['schema-updates'];
      for (const update of updates) {
        const changes = update.changes;
        for (const change of changes) {
          if (change.location.id) {
            const parent = this.locateItem(change.location.parent);
            if (parent) {
              parent.upsertWith(change);
            } else {
              throw 'Cannot find parent element: ' + change.location.parent;
            }
          }
        }
      }
    }
  }

  /**
   * Locate an item from it's position in the model
   * @param schemaPosition
   * @param resolveReference true to resolve the last reference instead of returning a @DontCodeSchemaRef
   */
  locateItem(
    schemaPosition: string,
    resolveReference?: boolean
  ): DontCodeSchemaItem {
    const split = schemaPosition.split('/');
    let cur: DontCodeSchemaItem | undefined = this.currentSchema;
    for (const value of split) {
      if (!cur) {
        console.error(
          'Could not find subItem ' + value + ' of ' + schemaPosition
        );
        throw new Error(
          'Could not find subItem ' + value + ' of ' + schemaPosition
        );
      }
      if (value && value.length > 0 && value !== '#') {
        if (cur.isReference())
          cur = this.resolveReference(cur as DontCodeSchemaRef);
        if (!cur) {
          console.error(
            'Could not find reference ' +
              (cur as unknown as DontCodeSchemaRef)?.getReference() +
              ' of ' +
              schemaPosition
          );
          throw new Error(
            'Could not find reference ' +
              (cur as unknown as DontCodeSchemaRef)?.getReference() +
              ' of ' +
              schemaPosition
          );
        }
        cur = cur.getChild(value);
      }
    }

    if (resolveReference && cur?.isReference()) {
      cur = this.resolveReference(cur as DontCodeSchemaRef);
    }
    if (cur!=null)
      return cur;
    else {
      throw new Error(
        'Could not find item at schema position ' + schemaPosition);

    }
  }

  resolveReference(ref: DontCodeSchemaRef): DontCodeSchemaItem {
    return this.locateItem(ref.getReference());
  }

  generateParentPointer(
    pointer: DontCodeModelPointer
  ): DontCodeModelPointer | undefined {
    if (pointer.containerPosition != null)
      return this.generateSchemaPointer(pointer.containerPosition);
    return;
  }

  /**
   * Generates a new and complete DontCodeModelPointer from the specified position
   * @param queriedPosition
   */
  generateSchemaPointer(queriedPosition: string): DontCodeModelPointer {
    let ret: DontCodeModelPointer;

    const position = queriedPosition;
    const posElems = position.split('/');

    if (posElems.length === 0 || posElems[0].length === 0) {
      // Managing the special case of asking for root
      ret = new DontCodeModelPointer(queriedPosition, queriedPosition);
      return ret;
    } else {
      ret = new DontCodeModelPointer(queriedPosition, '');
    }

    let parentItem = this.currentSchema as DontCodeSchemaItem;
    let ignoreNext = false;
    for (const element of posElems) {
      if (!ignoreNext) {
        let nextItem =
          parentItem.getChild(element) ??
          parentItem.isPossibleDynamicProperty(element);
        if (nextItem) {
          ret.isProperty = true;
          ret.containerPositionInSchema = ret.positionInSchema;
          if (ret.positionInSchema !== null && ret.positionInSchema.length > 0)
            ret.positionInSchema = ret.positionInSchema + '/' + element;
          else ret.positionInSchema = element;

          if (nextItem.isArray()) {
            ignoreNext = true;
          } else {
            ignoreNext = false;
          }

          if (nextItem.isReference())
            nextItem = this.resolveReference(nextItem as DontCodeSchemaRef);

          if (nextItem == null) {
            // Cannot find the next item in the schema: Error in the url
            throw new Error(
              "Cannot parse '" +
                position +
                "' from the schema as " +
                nextItem +
                ' is reference an unknown element'
            );
          }
          parentItem = nextItem;
        } else {
          // Cannot find the next item in the schema: Error in the url
          throw new Error(
            "Cannot parse '" +
              position +
              "' from the schema as " +
              element +
              ' is not a child of ' +
              parentItem.getRelativeId()
          );
        }
      } else {
        ret.isProperty = false;
        ignoreNext = false;
      }
    }

    ret.containerPositionInSchema = ret.positionInSchema.substring(
      0,
      ret.positionInSchema.lastIndexOf('/')
    );
    ret.containerPosition = ret.position.substring(
      0,
      ret.position.lastIndexOf('/')
    );
    ret.lastElement = posElems[posElems.length - 1];

    return ret;
  }

  /**
   * Returns the pointer to the subElement of the given pointer. It checked whether the given propOrItemName is a property or an item
   * by looking at the schema
   * @param panullrent
   * @param propOrItemName
   */
  generateSubSchemaPointer(
    parent: DontCodeModelPointer,
    propOrItemName: string
  ): DontCodeModelPointer {
    if (
      this.locateItem(parent.positionInSchema, true).getChild(propOrItemName)
    ) {
      return parent.subPropertyPointer(propOrItemName);
    } else {
      return parent.subItemPointer(propOrItemName);
    }
  }

  reset() {
    this.readSchema = DontCodeSchema.defaultv1;
    this.currentSchema = this.convertSchemaToMap(this.readSchema);
  }
}
