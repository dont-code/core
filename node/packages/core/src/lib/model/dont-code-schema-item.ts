import * as DontCode from '../globals';

/**
 * Stores and manipulate the schema representing a dont-code application
 */
export interface DontCodeSchemaItem {
  isObject(): boolean;
  isArray(): boolean;
  isEnum(): boolean;
  isValue(): boolean;
  isReference(): boolean;
  isRoot(): boolean;
  isReadonly(): boolean;
  isHidden(): boolean;

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
  getChildren(): IterableIterator<[string, DontCodeSchemaItem]>;

  /**
   * Returns all properties
   */
  allProperties(): IterableIterator<[string, DontCodeSchemaProperty]>;
  getProperties(code: string): DontCodeSchemaProperty | undefined;
  hasProperties(code: string): boolean;

  /**
   * Check if possibly the property named code can be assigned to this schemaItem by one of its child dynamically.
   * @param code
   */
  isPossibleDynamicProperty(code: string): DontCodeSchemaProperty | undefined;

  /**
   * Returns all the children and the dynamic properties that could appear depending on the data
   */
  getChildrenAndPossibleProperties (): IterableIterator<[string, DontCodeSchemaItem]>;

  getRelativeId(): string | undefined;
  setRelativeId(relativeId: string | undefined): void;

  getTargetPath(): string | undefined;
}

export abstract class AbstractSchemaItem implements DontCodeSchemaItem {
  protected parent: DontCodeSchemaItem | undefined;
  protected array = false;
  protected readOnly = false;
  protected hidden = false;
  protected relativeId: string | undefined;
  protected targetPath: string | undefined;

  protected constructor(
    parent: DontCodeSchemaItem | undefined,
    relativeId?: string
  ) {
    this.parent = parent;
    this.relativeId = relativeId;
  }

  isArray(): boolean {
    return this.array;
  }

  setArray(val: boolean) {
    this.array = val;
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

  isHidden(): boolean {
    return this.hidden;
  }

  setHidden(val: boolean): void {
    this.hidden = val;
  }

  isReadonly(): boolean {
    return this.readOnly;
  }

  setReadonly(val: boolean): void {
    this.readOnly = val;
  }

  public static generateItem(
    json: any,
    itemId: string,
    parent?: DontCodeSchemaItem
  ): AbstractSchemaItem {
    let isArray = Array.isArray(json);

    if (isArray) {
      console.error('arrays are not supported', json);
      return json;
    }

    let ret: AbstractSchemaItem;
    isArray = false;

    if (json['type']) {
      const type = json['type'];
      switch (type) {
        case 'object':
          ret = new DontCodeSchemaObject(json, itemId, parent);
          break;
        case 'array':
          ret = this.generateItem(json['items'], itemId, parent);
          isArray = true;
          break;
        default:
          ret = new DontCodeSchemaValue(json, itemId, parent);
      }
    } else if (json['enum']) {
      ret = new DontCodeSchemaEnum(json, itemId, parent);
    } else if (json['$ref']) {
      ret = new DontCodeSchemaRef(json, itemId, parent);
    } else {
      return json;
    }
    if (json['readOnly'] === true) ret.setReadonly(true);
    if (json['writeOnly'] === true) ret.setHidden(true);
    ret.setArray(isArray);
    return ret;
  }

  public static isObject(item: any): boolean {
    return typeof item === 'object' && !Array.isArray(item) && item !== null;
  }

  public static goto(
    entity: DontCodeSchemaItem,
    to: string
  ): DontCodeSchemaItem | undefined {
    let ret: DontCodeSchemaItem | undefined = entity;
    to.split('/').forEach((value) => {
      if (value !== '#' && value != '') {
        ret = ret?.getChild(value);
      }
      if (!ret) {
        console.error(
          'Cannot find ' + value + ' of ' + to + ' in the following item ',
          entity
        );
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

  getChildren(): IterableIterator<[string, DontCodeSchemaItem]> {
    return new Map().entries();
  }

  updateWith(update: DontCode.ChangeConfig): void {
    //
  }

  allProperties(): IterableIterator<[string, DontCodeSchemaProperty]> {
    return [].values();
  }

  getProperties(code: string): DontCodeSchemaProperty | undefined {
    return undefined;
  }

  hasProperties(code: string): boolean {
    return false;
  }

  getRelativeId(): string | undefined {
    return this.relativeId;
  }
  setRelativeId(relativeId: string | undefined) {
    this.relativeId = relativeId;
  }

  getTargetPath(): string | undefined {
    return this.targetPath;
  }

  setTargetPath(newPath: string): void {
    this.targetPath = newPath;
  }

  isPossibleDynamicProperty(code: string): DontCodeSchemaProperty | undefined {
    const children = this.getChildren();
    for (const child of children) {
      const childProps = child[1].allProperties();
      for (const childProp of childProps) {
        if (childProp[1].getChild(code)) {
          return childProp[1];
        }
      }
    }
    return undefined;
  }

  /**
   * Returns all properties that can be used by this SchemaItem depending on the values entered
   */
  getAllPossibleDynamicProperties ():IterableIterator<[string, DontCodeSchemaItem]> {
    const children = this.getChildren();
    const ret = new Map<string, DontCodeSchemaItem>();
    for (const child of children) {
      const childProps = child[1].allProperties();
      for (const childProp of childProps) {
        for (const childChildProp of childProp[1].getChildren()) {
          if (ret.has(childChildProp[0])) {
            console.warn("Dynamic Property "+childChildProp[0]+" is being defined by multiple children.");
          }
          ret.set(childChildProp[0], childChildProp[1]);
        }
      }
    }
    return ret.entries();
  }

  /**
   * Returns the list of children and all possible dynamic properties that can be created depending on the values entered
   */
  getChildrenAndPossibleProperties(): IterableIterator<[string, DontCodeSchemaItem]> {
    return concatIterable(this.getChildren(), this.getAllPossibleDynamicProperties());
  }

}

/**
 * Generator function to combine multiple iterators into one
 * @param iterators
 */
export function* concatIterable<T>(...iterators: IterableIterator<T>[]) {
  for (let i of iterators) {
      i = i[Symbol.iterator]();

    let f: IteratorResult<T> | Promise<IteratorResult<T>>;
    while (true) {
      f = i.next();
      if (f.done) {
        break;
      }
      yield f.value;
    }
  }
}

/**
 * Handles an item defined as an object consisting of a name and a set of named children
 */
export class DontCodeSchemaObject extends AbstractSchemaItem {
  protected children = new Map<string, DontCodeSchemaItem>();

  constructor(json: any, relativeId?: string, parent?: DontCodeSchemaItem) {
    super(parent, relativeId);
    if (json) this.readJson(json);
  }

  protected readJson(json: any) {
    const props = json['properties'];
    if (props) {
      for (const key in props) {
        this.children.set(
          key,
          AbstractSchemaItem.generateItem(props[key], key, this)
        );
      }
    }
    /*const definitions =json['$defs'];
    if( definitions) {
      const defsItem=AbstractSchemaItem.generateItem(definitions, '$defs', this);
      this.children.set('$defs', defsItem);
    }*/
  }

  override isEnum(): boolean {
    return false;
  }

  override isObject(): boolean {
    return true;
  }

  override isReference(): boolean {
    return false;
  }

  override isValue(): boolean {
    return false;
  }

  override isRoot(): boolean {
    return false;
  }

  override upsertWith(change: DontCode.ChangeConfig): boolean {
    const existsOrNot = this.getChild(change.location.id);
    if (!existsOrNot) {
      if (change.location.id!=null) {
        const exists = AbstractSchemaItem.generateItem(
          change.update,
          change.location.id,
          this
        );
        if (change.location.after) {
          const newMap = new Map<string, DontCodeSchemaItem>();
          this.children.forEach((value, key) => {
            newMap.set(key, value);
            if ((key === change.location.after)&&(change.location.id!=null)) {
              newMap.set(change.location.id, exists);
            }
          });
          this.children = newMap;
        } else {
          this.children.set(change.location.id, exists);
        }
        exists.updateWith(change);
      }
    } else {
      // Make sure to load the sub-properties
      existsOrNot.updateWith(change);
    }
    return true;
  }

  override updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
  }

  override getChild(id?: string): DontCodeSchemaItem | undefined {
    if (id) return this.children.get(id);
    else return;
  }

  override getChildren(): IterableIterator<[string, DontCodeSchemaItem]> {
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
export class DontCodeSchemaRoot extends DontCodeSchemaObject {
  constructor(json?: any) {
    super(json, undefined);
  }

  protected override readJson(json: any) {
    super.readJson(json);

    // Let the base class believe it's a property and do all the work !
    const $defs = json['$defs'];
    if ($defs) {
      this.children.set(
        '$defs',
        new DontCodeSchemaObject(
          {
            properties: $defs,
          },
          '$defs',
          this
        )
      );
    }
  }

  override isEnum(): boolean {
    return false;
  }

  override isObject(): boolean {
    return true;
  }

  override isReference(): boolean {
    return false;
  }

  override isValue(): boolean {
    return false;
  }
  override isRoot(): boolean {
    return true;
  }
}

/**
 * Supports selection of a value amongst a list (or a hierarchical tree)
 */
export class DontCodeSchemaEnum extends AbstractSchemaItem {
  protected values = new Array<DontCodeSchemaEnumValue>();
  protected properties = new Map<string, DontCodeSchemaProperty>();

  constructor(json: any, relativeId?: string, parent?: DontCodeSchemaItem) {
    super(parent, relativeId);
    this.updateValues(json['enum'], this.values);
    this.targetPath = json['format'];
  }

  override isEnum(): boolean {
    return true;
  }

  override isObject(): boolean {
    return false;
  }

  override isReference(): boolean {
    return false;
  }

  override isValue(): boolean {
    return false;
  }

  override isRoot(): boolean {
    return false;
  }

  getValues(): Array<DontCodeSchemaEnumValue> {
    return this.values;
  }

  override updateWith(update: DontCode.ChangeConfig) {
    super.updateWith(update);
    this.updateValues(update.update['enum'], this.values, update);
  }

  updateValues(
    values: Array<any>,
    destination: Array<DontCodeSchemaEnumValue>,
    from?: DontCode.ChangeConfig
  ): void {
    values.forEach((value) => {
      if (typeof value === 'string') {
        if (
          !destination.find((dest) => {
            return dest.getValue() === value;
          })
        ) {
          destination.push(new DontCodeSchemaEnumValue(value));
        }
        if (from?.props) {
          const props = new DontCodeSchemaProperty(
            from,
            this.relativeId + '=' + value,
            this
          );
          if (!props.isEmpty()) this.properties.set(value, props);
        }
      } else {
        for (const subKey in value) {
          if (value.hasOwnProperty(subKey)) {
            let enumValue = destination.find((dest) => {
              return dest.getValue() === value;
            });
            if (!enumValue) {
              enumValue = new DontCodeSchemaEnumValue(subKey);
              destination.push(enumValue);
            }
            if (!enumValue.getChildren()) enumValue.setChildren([]);
            this.updateValues(
              value[subKey].enum,
              enumValue.getChildren(),
              from
            );
          }
        }
      }
    });
  }

  override allProperties(): IterableIterator<[string, DontCodeSchemaProperty]> {
    return this.properties.entries();
  }

  override getProperties(code: string): DontCodeSchemaProperty | undefined {
    return this.properties.get(code);
  }

  override hasProperties(code: string): boolean {
    return this.properties.has(code);
  }
}

/**
 * A Simple class to store possible hierarchies of values, and separate label from the model value
 */
export class DontCodeSchemaEnumValue {
  private _label: string;
  private _value: string;
  private _children = new Array<DontCodeSchemaEnumValue>();

  constructor(value: string, label?: string) {
    this._value = value;
    if (label) {
      this._label = label;
    } else {
      this._label = value;
    }
  }

  getLabel(): string {
    if (this._label) return this._label;
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
  protected type: string;

  constructor(json: any, relativeId?: string, parent?: DontCodeSchemaItem) {
    super(parent, relativeId);
    this.type = json['type'];
    this.targetPath = json['format'];
  }

  override isValue(): boolean {
    return true;
  }

  getType(): string {
    return this.type;
  }
}

/**
 * This item is a reference (in json-schema term) to a definition elsewhere in the schema.
 */
export class DontCodeSchemaRef extends AbstractSchemaItem {
  protected ref: string;
  protected resolvedRef = new Map<string, DontCodeSchemaItem>();

  constructor(json: any, relativeId?: string, parent?: DontCodeSchemaItem) {
    super(parent, relativeId);
    this.ref = json['$ref'];
  }

  override isReference(): boolean {
    return true;
  }

  getReference(): string {
    return this.ref;
  }

  resolveReference(resolved: DontCodeSchemaItem) {
    this.resolvedRef.set('', resolved);
  }

  override getChildren(): IterableIterator<[string, DontCodeSchemaItem]> {
    return this.resolvedRef.entries();
  }
}

/**
 * An Object Item in the schema can define alternative subproperties that are used depending on some values.
 */
export class DontCodeSchemaProperty extends DontCodeSchemaObject {
  protected replace: boolean;
  protected posAfter?: string;

  constructor(
    json: DontCode.ChangeConfig,
    relativeId: string,
    parent: DontCodeSchemaItem
  ) {
    super(
      {
        type: 'object',
        properties: json.props,
      },
      relativeId,
      parent
    );
    if (json.replace) {
      this.replace = json.replace;
    } else {
      this.replace = false;
    }
    this.posAfter = json.location.after;
  }

  isEmpty(): boolean {
    return this.children.size == 0;
  }

  isReplace(): boolean {
    return this.replace;
  }

  getPosAfter(): string | undefined {
    return this.posAfter;
  }
}
