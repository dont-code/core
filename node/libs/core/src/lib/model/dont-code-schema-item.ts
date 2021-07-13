import * as DontCode from "../globals";

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
  updateWith(update: DontCode.ChangeConfig): void;

  getParent(): DontCodeSchemaItem | undefined;
  getChild(id?: string): DontCodeSchemaItem | undefined;
//  getChildIndex (child:DontCodeSchemaItem): number;
  getChildren (): IterableIterator<[string, DontCodeSchemaItem]>;
  getProperties(code: string): DontCodeSchemaProperty | undefined;
  hasProperties (code:string): boolean;

  getRelativeId (): string|undefined;
  setRelativeId (relativeId:string|undefined): void;
}

export abstract class AbstractSchemaItem implements DontCodeSchemaItem{
  protected parent: DontCodeSchemaItem|undefined;
  protected array = false;
  protected relativeId:string|undefined;

  protected constructor(parent:DontCodeSchemaItem|undefined, relativeId?:string) {
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

  public static isObject (item:any): boolean {
    return (typeof item === "object" && !Array.isArray(item) && item !== null);
  }

  public static goto (entity: DontCodeSchemaItem, to:string): DontCodeSchemaItem|undefined {
    let ret:DontCodeSchemaItem|undefined = entity;
    to.split('/').forEach(value => {
      if( value!=='#' && (value!='')) {
        ret=ret?.getChild(value);
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

  getParent(): DontCodeSchemaItem | undefined {
    return this.parent;
  }

  getChild(id?: string): DontCodeSchemaItem | undefined {
    return;
  }

  getChildren (): IterableIterator<[string, DontCodeSchemaItem]> {
    return new Map().entries();
  }

  updateWith(update: DontCode.ChangeConfig):void {
  }

  getProperties(code: string): DontCodeSchemaProperty | undefined {
    return undefined;
  }

  hasProperties (code:string): boolean {
    return false;
  }

  getRelativeId (): string|undefined {
    return this.relativeId;
  }
  setRelativeId (relativeId:string|undefined) {
    this.relativeId = relativeId;
  }

}

/**
 * Handles an item defined as an object consisting of a name and a set of named properties)
 */
export class DontCodeSchemaObject extends AbstractSchemaItem {
  protected children = new Map<string, DontCodeSchemaItem>();

  constructor(json:any, relativeId?:string, parent?:DontCodeSchemaItem) {
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
    let existsOrNot = this.getChild(change.location.id);
    if( !existsOrNot) {
      let exists = AbstractSchemaItem.generateItem(change.update, change.location.id, this);
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
      exists.updateWith(change);
    } else {
      // Make sure to load the sub-properties
      existsOrNot.updateWith(change);
    }
    return true;
  }

  updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
  }

  getChild(id?: string): DontCodeSchemaItem | undefined {
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

/**
 * The root item of the model is a specialized object
 */
export class DontCodeSchemaRoot extends DontCodeSchemaObject{
  constructor(json?:any) {
    super(json, undefined);
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

/**
 * Supports selection of a value amongst a list (or a hierarchical tree)
 */
export class DontCodeSchemaEnum extends AbstractSchemaItem {
  protected values = new Array<DontCodeSchemaEnumValue>();
  protected properties = new Map<string, DontCodeSchemaProperty>();

  constructor(json:any, relativeId?:string, parent?:DontCodeSchemaItem) {
    super(parent, relativeId);
    this.updateValues (json["enum"], this.values);
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

  getValues (): Array<DontCodeSchemaEnumValue> {
    return this.values;
  }

  updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
    this.updateValues(update.update['enum'], this.values, update);
  }

  updateValues (values:Array<any>, destination:Array<DontCodeSchemaEnumValue>, from?:DontCode.ChangeConfig):void  {
    values.forEach(value => {
      if( typeof value === 'string') {
        if (!destination.find(dest => {
          return dest.getValue()===value;
        })) {
          destination.push(new DontCodeSchemaEnumValue(value));
        }
        if( from?.props) {
              const props = new DontCodeSchemaProperty(from, this.relativeId + '=' + value, this);
              if (!props.isEmpty())
                this.properties.set(value, props);
            }

        } else {
          for (let subKey in value) {
            if( value.hasOwnProperty(subKey)) {
              let enumValue= destination.find(dest => {
                return dest.getValue() ===value;
              });
              if( !enumValue) {
                enumValue = new DontCodeSchemaEnumValue(subKey);
                destination.push(enumValue);
              }
              if (!enumValue.getChildren())  enumValue.setChildren(Array());
              this.updateValues(value[subKey].enum, enumValue.getChildren(), from);
            }
          }
        }

    });
  }

  getProperties(code: string): DontCodeSchemaProperty | undefined {
    return this.properties.get(code);
  }

  hasProperties (code:string): boolean {
    return this.properties.has(code);
  }

}

/**
 * A Simple class to store possible hierarchies of values, and separate label from the model value
 */
export class DontCodeSchemaEnumValue {
  private _label:string;
  private _value:string;
  private _children = new Array<DontCodeSchemaEnumValue> ();


  constructor(value: string, label?: string) {
    this._value = value;
    if(label) {
      this._label=label;
    }else {
      this._label=value;
    }
  }

  getLabel(): string {
    if( this._label) return this._label;
    else return this._value;
  }

  setLabel(value: string) {
    this._label = value;
  }

  getValue(): string {
    return this._value;
  }

  setValue(value: string) {
    this._value = value;
  }

  getChildren(): Array<DontCodeSchemaEnumValue> {
    return this._children;
  }

  setChildren(value: Array<DontCodeSchemaEnumValue>) {
    this._children = value;
  }
}

/**
 * The model item is just a value that the user can change
 */
export class DontCodeSchemaValue extends AbstractSchemaItem {
  protected type:string;

  constructor(json:any, relativeId?:string, parent?:DontCodeSchemaItem) {
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

/**
 * This item is a reference (in json-schema term) to a definition elsewhere in the schema.
 */
export class DontCodeSchemaRef extends AbstractSchemaItem {
  protected ref:string;
  protected resolvedRef=new Map<string, DontCodeSchemaItem>();

  constructor(json:any, relativeId?:string, parent?:DontCodeSchemaItem) {
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

/**
 * An Object Item in the schema can define alternative subproperties that are used depending on some values.
 */
export class DontCodeSchemaProperty extends DontCodeSchemaObject{
  protected replace:boolean;
  protected posAfter?:string;

  constructor(json: DontCode.ChangeConfig, relativeId: string, parent: DontCodeSchemaItem) {
    super({
      "type":"object",
      "properties":json.props
    }, relativeId, parent);
    if (json.replace) {
      this.replace = json.replace;
    }else {
      this.replace=false;
    }
    this.posAfter = json.location.after;
  }

  isEmpty(): boolean {
    return this.children.size==0;
  }

  isReplace (): boolean {
    return this.replace;
  }

  getPosAfter (): string |undefined{
    return this.posAfter;
  }
}


