/**
 * Stores and manipulate the schema representing a dont-code application
 */
export interface DontCodeSchemaItem {

  isObject (): boolean;
  isArray (): boolean;
  isEnum (): boolean;
  isValue (): boolean;
  isReference (): boolean;
}

export class AbstractSchemaItem implements DontCodeSchemaItem{
  isArray(): boolean {
    return false;
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

  public static generateItem (json:any): any {
    if (Array.isArray(json)) {
      return json;
    }
    const type = json['type'];
    if (type) {
      switch (type) {
        case 'object': {
          return new DontCodeSchemaObject(json);
        }
        case 'array': {
          return new DontCodeSchemaArray(json);
        }
        default: {
          return new DontCodeSchemaValue(json);
        }
      }
    } else if (json["enum"]) {
      return new DontCodeSchemaEnum(json);
    } else if (json["$ref"]) {
      return new DontCodeSchemaRef(json);
    }
    else
    {
      return json;
    }
  }

  public static isObject (item): boolean {
    return (typeof item === "object" && !Array.isArray(item) && item !== null);
  }

}

export class DontCodeSchemaObject extends Map implements DontCodeSchemaItem {
  constructor(json?:any) {
    super();
    if (json)
      this.readJson (json);
  }

  protected readJson (json:any) {
    const props =json['properties'];
    if( props) {
      for (var key in props) {
        this.set(key, AbstractSchemaItem.generateItem(props[key]));
      }
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


}

export class DontCodeSchemaArray extends AbstractSchemaItem {
  protected items:DontCodeSchemaItem;

  constructor(json:any) {
    super();
    this.items = AbstractSchemaItem.generateItem(json['items']);
  }

  isArray(): boolean {
    return true;
  }

  getItemsSchemaItem (): DontCodeSchemaItem {
    return this.items;
  }
}
export class DontCodeSchemaEnum extends Array implements DontCodeSchemaItem {
  constructor(json:any) {
    super();
    this.push(...json["enum"]);
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
}

export class DontCodeSchemaValue extends AbstractSchemaItem {
  protected type:string;

  constructor(json:any) {
    super();
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

  constructor(json:any) {
    super();
    this.ref=json["$ref"];
  }

  isReference(): boolean {
    return true;
  }

  getReference (): string {
    return this.ref;
  }

}
