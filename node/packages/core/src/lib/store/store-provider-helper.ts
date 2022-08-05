/**
 * Helps handle metadata information about loaded items
 */
export class StoreProviderHelper {

  static specialFieldsCache = new Map<string, SpecialFields>();
  /**
   * In case some entity definition has changed, clear the cache
   */
  public static clearConfigCache (): void {
    this.specialFieldsCache.clear();
  }

  /** Returns any field who is a date, in order to convert it from json. Keep the result in a cache map
   *
   * @param position
   * @param entity
   * @protected
   */
  public static findSpecialFields (position:string, entity:any):SpecialFields {
    let specialFields = StoreProviderHelper.specialFieldsCache.get(position);
    if (specialFields!=null) return specialFields;

    const curScore: {score:number, field:any} = {score:-1, field:null}

    specialFields = new SpecialFields();
    const fields = entity.fields;
    if( fields!=null) {
      let prop: keyof typeof fields;
      for (prop in fields) {
        // Finds the date fields that will need to be converted from json to javascript Date
        if (fields[prop]?.type==='Date' || fields[prop]?.type==='Date & Time') {
          specialFields.addDateField(fields[prop]?.name);
        } else {
          StoreProviderHelper.scoreIdFieldFromEntityField(fields[prop], curScore);
        }
      }
    }
    if (curScore.score>0) {
      specialFields.idField=curScore.field;
    }
    StoreProviderHelper.specialFieldsCache.set(position, specialFields);

    // eslint-disable-next-line no-restricted-syntax
    console.debug("Found special fields for entity at position "+position, specialFields);
    return specialFields;
  }

  protected static findSpecialFieldsFromData(data: Array<any>, existingFields: SpecialFields) {
    if( (existingFields.idField==null) && (data?.length>0)) {
      // We must guess the id field from data
      const first=data[0];
      const curScore: {score:number, field:any} = {score:-1, field:null}
      let prop: keyof typeof first;

      for (prop in first) {
        StoreProviderHelper.scoreIdFieldFromProperty(prop, curScore);
      }
      if (curScore.score>0) {
        const test=data.length>1?data[Math.floor((data.length+1)/2)]:null;
        if ((test==null) || (test[curScore.field]!=first[curScore.field]))  // Just check that another element doesn't have the same value as an id should be unique
          existingFields.idField=curScore.field;
      }
    }
  }

  protected static scoreIdFieldFromEntityField (prop:any, score:{score:number, field:any}): boolean {
    return StoreProviderHelper.scoreIdFieldFromProperty(prop?.name, score);
  }

  protected static scoreIdFieldFromProperty (name:string, score:{score:number, field:any}): boolean {
    if( name==null)
      return false;
    const propName=name.toLowerCase();
    // Finds if the element is the id field
    if( propName === "_id") {
      score.field="_id";  // Don't need to process Id
      score.score = 100;
      return true;
    } else {
      if ((propName == "id")||(propName=="uniqueid")||(propName=="identifier") || (propName=='key') || (propName=='primaryKey')||(propName=='uniqueKey')) {
        if (score.score<80) {
          score.score=80;
          score.field=name;
        }
      } else if (propName.includes("unique")||propName.includes("primary")) {
        if (score.score<50) {
          score.score = 50;
          score.field=name;
        }
      }else if (propName.includes("id")||propName.includes('key')) {
        if (score.score<30) {
          score.score = 30;
          score.field=name;
        }
      }
      return false;
    }

  }
  /**
   * Ensure _id is removed if necessary before saving the element
   * @param listToConvert
   * @param specialFields
   * @protected
   */
  public static cleanUpDataBeforeSaving (listToConvert:Array<any>, specialFields:SpecialFields) : void {
    if ((specialFields?.idField!=null)&&(specialFields?.idField!='_id')) {
      listToConvert.forEach(value => {
        delete value._id;
      })
    }
  }

  /**
   * Converts dates and dateTimes properties of each element of the array to Typescript format
   * Ensure _id is set with the right id
   * @param listToConvert
   * @param specialFields
   * @protected
   */
  public static cleanUpLoadedData (listToConvert:Array<any>, specialFields:SpecialFields) : void {

    if (specialFields!=null) {
      if( specialFields.idField==null) {
        StoreProviderHelper.findSpecialFieldsFromData (listToConvert, specialFields);
      }
      listToConvert.forEach((val)=> {
        if ((specialFields.idField!=null)&&(specialFields.idField!="_id")) // We need to copy the id to the standard _id field
        {
          val._id=val[specialFields.idField];
        }
        specialFields.dateFields?.forEach(prop => {
          const toConvert = val[prop];
          if (toConvert!=null) {
            let timeEpoch =Date.parse(toConvert);
            if( isNaN(timeEpoch)) {
              // Invalid date try to remove a possible TZ description in []
              const tzDescIndex = toConvert.lastIndexOf('[');
              if (tzDescIndex!=-1) {
                timeEpoch=Date.parse(toConvert.substring(0, tzDescIndex));
              }
            }
            if (isNaN(timeEpoch)) {
              delete val[prop];
            }
            else {
              val[prop]=new Date(timeEpoch);
            }
          }
        })
      })
    }
  }

}

export class SpecialFields
{
  dateFields:Array<string>|null=null;
  idField:any = null;

  addDateField(name: any) {
    if (this.dateFields==null) {
      this.dateFields = new Array<string>();
    }
    this.dateFields.push(name);
  }
}
