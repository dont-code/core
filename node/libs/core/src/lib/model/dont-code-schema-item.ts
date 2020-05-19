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

  upsertWith(change: DontCode.ChangeConfig): boolean;
  updateWith(update: any);

  getParent (): DontCodeSchemaItem;
  getChild (id?:string): DontCodeSchemaItem;
}

export abstract class AbstractSchemaItem implements DontCodeSchemaItem{
  protected parent: DontCodeSchemaItem;
  protected array = false;

  constructor(parent?:DontCodeSchemaItem) {
    this.parent=parent;
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

  public static generateItem ( json:any, parent?:DontCodeSchemaItem): AbstractSchemaItem {
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
          ret= new DontCodeSchemaObject(json, parent);
          break;
        case 'array':
          ret= this.generateItem(json['items'], parent);
          isArray=true;
          break;
        default:
          ret= new DontCodeSchemaValue(json, parent);
      }
    } else if (json['enum']) {
      ret= new DontCodeSchemaEnum(json, parent);
    } else if (json['$ref']) {
      ret= new DontCodeSchemaRef(json, parent);
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

  upsertWith(change: DontCode.ChangeConfig): boolean {
    return false;
  }

  getParent(): DontCodeSchemaItem {
    return this.parent;
  }

  getChild (id?:string): DontCodeSchemaItem {
    return;
  }

  updateWith(update: any) {
  }


}

export class DontCodeSchemaObject extends AbstractSchemaItem {
  protected children = new Map<string, DontCodeSchemaItem>();

  constructor(json:any,parent?:DontCodeSchemaItem) {
    super(parent);
    if (json)
      this.readJson (json);
  }

  protected readJson (json:any) {
    const props =json['properties'];
    if( props) {
      for (var key in props) {
        this.children.set(key, AbstractSchemaItem.generateItem(props[key], this));
      }
    }
    const definitions =json['definitions'];
    if( definitions) {
      const defsItem=AbstractSchemaItem.generateItem(definitions, this);
      this.children.set('definitions', defsItem);
    }
  }

  isArray(): boolean {
    return false;
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
    const exists = this.getChild(change.location.id);
    if( !exists) {
      this.children.set(change.location.id, AbstractSchemaItem.generateItem(change.add, this));
    } else {
      exists.updateWith(change.add);
    }
    return true;
  }

  updateWith(update: any) {
    super.updateWith(update);
  }

  getChild(id?: string): DontCodeSchemaItem {
    if( id)
      return this.children.get(id);
    else
      return;
  }
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
      }, this));
    }
  }

  isArray(): boolean {
    return false;
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

/*export class DontCodeSchemaArray extends AbstractSchemaItem {
  protected items:DontCodeSchemaItem;

  constructor(json:any,parent?:DontCodeSchemaItem) {
    super(parent);
    this.items = AbstractSchemaItem.generateItem(json['items'], this);
  }

  isArray(): boolean {
    return true;
  }

  getItemsSchemaItem (): DontCodeSchemaItem {
    return this.items;
  }

  getChild(id?: string): DontCodeSchemaItem {
    if(!id)
      return this.items;
    else
      return;
  }
}*/

export class DontCodeSchemaEnum extends AbstractSchemaItem {
  protected values = new Array<string>();

  constructor(json:any, parent?:DontCodeSchemaItem) {
    super(parent);
    this.values.push(...json["enum"]);
  }

  isEnum(): boolean {
    return true;
  }

  isArray(): boolean {
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

  getValues (): Array<string> {
    return this.values;
  }


  updateWith(update: any) {
    super.updateWith(update);
    const toAdd = update['enum'] as Array<string>;
    this.values.push(...toAdd);
  }
}

export class DontCodeSchemaValue extends AbstractSchemaItem {
  protected type:string;

  constructor(json:any, parent?:DontCodeSchemaItem) {
    super(parent);
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

  constructor(json:any, parent?:DontCodeSchemaItem) {
    super(parent);
    this.ref=json["$ref"];
  }

  isReference(): boolean {
    return true;
  }

  getReference (): string {
    return this.ref;
  }

}
