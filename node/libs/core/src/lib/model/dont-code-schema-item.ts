import { DontCode } from "../globals";

/**
 * Stores and manipulate the schema representing a dont-code application
 */
export interface DontCodeSchemaItem {

  isObject (): boolean;
  isArray (): boolean;
  isEnum (): boolean;
  isValue (): boolean;
  isReference (): boolean;
  isRoot (): boolean;

  /**
   * Adds or update a child with the change given by the plugin
   * @param change
   */
  upsertWith(change: DontCode.ChangeConfig): boolean;

  /**
   * Updates the Schema Item with the given change config
   * @param update
   */
  updateWith(update: DontCode.ChangeConfig);

  getParent (): DontCodeSchemaItem;
  getChild (id?:string): DontCodeSchemaItem;
//  getChildIndex (child:DontCodeSchemaItem): number;
  getChildren (): IterableIterator<[string, DontCodeSchemaItem]>;
  getProperties (code:string): DontCodeSchemaProperty;
  hasProperties (code:string): boolean;

  getRelativeId (): string;
  setRelativeId (relativeId:string);
}

export abstract class AbstractSchemaItem implements DontCodeSchemaItem{
  protected parent: DontCodeSchemaItem;
  protected array = false;
  protected relativeId:string;

  protected constructor(parent:DontCodeSchemaItem, relativeId:string) {
    this.parent=parent;
    this.relativeId = relativeId;
  }

  isArray(): boolean {
    return this.array;
  }

  setArray (val:boolean) {
    this.array=val;
  }

  isEnum(): boolean {
    return false;
  }

  isObject(): boolean {
    return false;
  }

  isReference(): boolean {
    return false;
  }

  isValue(): boolean {
    return false;
  }

  isRoot(): boolean {
    return false;
  }

  public static generateItem ( json:any, itemId:string, parent?:DontCodeSchemaItem): AbstractSchemaItem {
    let isArray = Array.isArray(json);

    if( isArray) {
      console.error('arrays are not supported', json);
      return json;
    }

    let ret: AbstractSchemaItem;
    isArray = false;

    if (json['type']) {
      const type = json['type'];
      switch (type) {
        case 'object':
          ret= new DontCodeSchemaObject(json, itemId,parent);
          break;
        case 'array':
          ret= this.generateItem(json['items'], itemId, parent);
          isArray=true;
          break;
        default:
          ret= new DontCodeSchemaValue(json, itemId, parent);
      }
    } else if (json['enum']) {
      ret= new DontCodeSchemaEnum(json, itemId, parent);
    } else if (json['$ref']) {
      ret= new DontCodeSchemaRef(json, itemId, parent);
    }
    else
    {
      return json;
    }
    ret.setArray(isArray);
    return ret;
  }

  public static isObject (item): boolean {
    return (typeof item === "object" && !Array.isArray(item) && item !== null);
  }

  public static goto (entity: DontCodeSchemaItem, to:string): DontCodeSchemaItem {
    let ret = entity;
    to.split('/').forEach(value => {
      if( value!=='#' && (value!='')) {
        ret=ret.getChild(value);
      }
      if( !ret) {
        console.error('Cannot find '+value+' of '+to+' in the following item ', entity);
      }
    });
    return ret;
  }

  upsertWith(change: DontCode.ChangeConfig): boolean {
    return false;
  }

  getParent(): DontCodeSchemaItem {
    return this.parent;
  }

  getChild (id?:string): DontCodeSchemaItem {
    return;
  }

  getChildren (): IterableIterator<[string, DontCodeSchemaItem]> {
    return new Map().entries();
  }

  updateWith(update: DontCode.ChangeConfig) {
  }

  getProperties(code: string): DontCodeSchemaProperty {
    return undefined;
  }

  hasProperties (code:string): boolean {
    return false;
  }


  getRelativeId (): string {
    return this.relativeId;
  }
  setRelativeId (relativeId:string) {
    this.relativeId = relativeId;
  }

}

export class DontCodeSchemaObject extends AbstractSchemaItem {
  protected children = new Map<string, DontCodeSchemaItem>();

  constructor(json:any, relativeId:string, parent?:DontCodeSchemaItem) {
    super(parent, relativeId);
    if (json)
      this.readJson (json);
  }

  protected readJson (json:any) {
    const props =json['properties'];
    if( props) {
      for (var key in props) {
        this.children.set(key, AbstractSchemaItem.generateItem(props[key], key, this));
      }
    }
    const definitions =json['definitions'];
    if( definitions) {
      const defsItem=AbstractSchemaItem.generateItem(definitions, 'definitions', this);
      this.children.set('definitions', defsItem);
    }
  }

  isEnum(): boolean {
    return false;
  }

  isObject(): boolean {
    return true;
  }

  isReference(): boolean {
    return false;
  }

  isValue(): boolean {
    return false;
  }

  isRoot(): boolean {
    return false;
  }

  upsertWith(change: DontCode.ChangeConfig): boolean {
    let exists = this.getChild(change.location.id);
    if( !exists) {
      exists = AbstractSchemaItem.generateItem(change.add, change.location.id, this);
      if( change.location.after) {
        let newMap = new Map<string, DontCodeSchemaItem> ();
        this.children.forEach((value, key) => {
          newMap.set(key, value);
          if (key===change.location.after) {
            newMap.set(change.location.id, exists);
          }
        });
        this.children=newMap;
      } else {
        this.children.set(change.location.id, exists);
      }
    }
    // Make sure to load the sub-properties
    exists.updateWith(change);
    return true;
  }

  updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
  }

  getChild(id?: string): DontCodeSchemaItem {
    if( id)
      return this.children.get(id);
    else
      return;
  }

  getChildren(): IterableIterator<[string, DontCodeSchemaItem]> {
    return this.children.entries();
  }

  /*getChildIndex(child: DontCodeSchemaItem): number {
    let ret=-1;
    this.children.forEach((value, key) => {
      ret++;
      if( value===child)
        return ret;
    })
    return -1;
  }*/

}

export class DontCodeSchemaRoot extends DontCodeSchemaObject{
  constructor(json?:any) {
    super(json, null);
  }

  protected readJson (json:any) {
    super.readJson(json);

    const definitions =json['definitions'];
    if( definitions) {
      this.children.set('definitions', new DontCodeSchemaObject( {
        properties: definitions
      }, 'definitions', this));
    }
  }

  isEnum(): boolean {
    return false;
  }

  isObject(): boolean {
    return true;
  }

  isReference(): boolean {
    return false;
  }

  isValue(): boolean {
    return false;
  }
  isRoot(): boolean {
    return true;
  }
}

export class DontCodeSchemaEnum extends AbstractSchemaItem {
  protected values = new Array<string>();
  protected properties = new Map<string, DontCodeSchemaProperty>();

  constructor(json:any, relativeId:string, parent?:DontCodeSchemaItem) {
    super(parent, relativeId);
    this.values.push(...json["enum"]);
  }

  isEnum(): boolean {
    return true;
  }

  isObject(): boolean {
    return false;
  }

  isReference(): boolean {
    return false;
  }

  isValue(): boolean {
    return false;
  }

  isRoot(): boolean {
    return false;
  }

  getValues (): Array<string> {
    return this.values;
  }

  updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
    const toAdd = update.add['enum'] as Array<string>;
    toAdd.forEach(value => {
      if( this.values.indexOf(value)==-1)
        this.values.push(value);
      if( update.props) {
        const props=new DontCodeSchemaProperty(update, this.relativeId+'='+value,this);
        if( !props.isEmpty ())
          this.properties.set(value, props );
      }
    });
  }

  getProperties(code: string): DontCodeSchemaProperty {
    return this.properties.get(code);
  }

  hasProperties (code:string): boolean {
    return this.properties.has(code);
  }

}

export class DontCodeSchemaValue extends AbstractSchemaItem {
  protected type:string;

  constructor(json:any, relativeId:string, parent?:DontCodeSchemaItem) {
    super(parent, relativeId);
    this.type=json["type"];
  }

  isValue(): boolean {
    return true;
  }

  getType ():string {
    return this.type;
  }

}

export class DontCodeSchemaRef extends AbstractSchemaItem {
  protected ref:string;
  protected resolvedRef=new Map<string, DontCodeSchemaItem>();

  constructor(json:any, relativeId:string, parent?:DontCodeSchemaItem) {
    super(parent, relativeId);
    this.ref=json["$ref"];
  }

  isReference(): boolean {
    return true;
  }

  getReference (): string {
    return this.ref;
  }

  resolveReference (resolved:DontCodeSchemaItem) {
    this.resolvedRef.set('',resolved);
  }


  getChildren(): IterableIterator<[string, DontCodeSchemaItem]> {
    return this.resolvedRef.entries();
  }
}

export class DontCodeSchemaProperty extends DontCodeSchemaObject{
  protected replace:boolean;
  protected posAfter:string;

  constructor(json: DontCode.ChangeConfig, relativeId: string, parent: DontCodeSchemaItem) {
    super({
      "type":"object",
      "properties":json.props
    }, relativeId, parent);
    this.replace = json.replace;
    this.posAfter = json.location.after;
  }

  isEmpty(): boolean {
    return this.children.size==0;
  }

  isReplace (): boolean {
    return this.replace;
  }

  getPosAfter (): string {
    return this.posAfter;
  }
}


