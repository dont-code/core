import { DontCodeSchemaItem, DontCodeSchemaObject } from "./dont-code-schema-item";
import { DontCodeSchema } from "./dont-code-schema";

export class DontCodeSchemaManager {
  protected currentSchema:DontCodeSchemaItem;
  protected readSchema: any;

  constructor() {
    this.readSchema=DontCodeSchema.default;
    this.currentSchema = this.convertSchemaToMap (this.readSchema);
  }
  /**
   * Returns the current schema
   */
  getSchema (): DontCodeSchemaItem {
    return this.currentSchema;
  }

  private convertSchemaToMap(readSchema: any): DontCodeSchemaItem {

    return new DontCodeSchemaObject(readSchema);
  }
}
