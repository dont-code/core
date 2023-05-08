import {
  DontCodeStoreAggregate,
  DontCodeStoreCalculus,
  DontCodeStoreCriteria,
  DontCodeStoreCriteriaOperator,
  DontCodeStoreGroupby,
  DontCodeStoreSort
} from "./dont-code-store-manager";
import {DataTransformationInfo, DontCodeModelManager} from "../model/dont-code-model-manager";
import {DontCodeSchemaItem} from "../model/dont-code-schema-item";
import {DontCodeModelPointer} from "../model/dont-code-schema";

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

  /**
   * In case the provider source doesn't support search criteria, they can be applied here
   * @param list
   * @param criteria
   */
  public static applyFilters<T> (list:Array<T>, ...criteria: DontCodeStoreCriteria[]): Array<T> {
    if ((criteria==null)||(criteria.length==0)) return list;
    return list.filter(element => {
      for (const criterium of criteria) {
        const toTest = element[criterium.name as keyof T];
        switch (criterium.operator) {
          case DontCodeStoreCriteriaOperator.EQUALS:
            return criterium.value==toTest;
          case DontCodeStoreCriteriaOperator.LESS_THAN:
            return toTest < criterium.value;
          case DontCodeStoreCriteriaOperator.LESS_THAN_EQUAL:
            return toTest <= criterium.value;
          default:
            throw new Error ("Operator "+criterium.operator+" unknown");
        }
      }
      return true;
    });
    return list;
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

  /**
   * Sort the array using the defined sort declarations across all properties.
   *
   * @param toSort
   * @param sortOptions
   */
  static multiSortArray<T>(toSort: T[], sortOptions?: DontCodeStoreSort): T[] {
    if( sortOptions==null)
      return toSort;
    return toSort;
  }

  static calculateGroupedByValues<T>(values: T[], groupBy: DontCodeStoreGroupby, modelMgr?: DontCodeModelManager, position?: DontCodeModelPointer, item?:DontCodeSchemaItem):DontCodeStoreGroupedByEntities|undefined {
    const counters=new Map<keyof T, Counters> ();
    let ret: DontCodeStoreGroupedByEntities|undefined;
    if ((groupBy!=null) && (groupBy.aggregates!=null)) {
      const fieldsRequired = groupBy.getRequiredListOfFields() as Set<keyof T>;
      for (const field of fieldsRequired) {
        const counter=new Counters();
        counters.set(field, counter);
        for (const value of values) {
          let val=value[field];
          if (val!=null) {
            if ((typeof val === 'object') && (modelMgr!=null)) {
              val = modelMgr.extractValue(val, counter.metaData, position, item);
            }
            if (typeof val === 'number') {
              counter.sum=counter.sum+val;
              if( (counter.minimum==null) || (val < counter.minimum))
                counter.minimum=val;
              if( (counter.maximum==null) || (val > counter.maximum))
                counter.maximum=val;
            } else if ((val instanceof Date) && (!isNaN(val.getTime()))) {
              if ((counter.minimum==null) || (val.valueOf() < counter.minimum.valueOf())) {
                counter.minimum=val;
              }
              if ((counter.maximum==null) || (val.valueOf() > counter.maximum.valueOf())) {
                counter.maximum=val;
              }
            }
            if (val!=null) counter.count++;
          }
        }
      }

      // Now that we have all the counters, let's generate the GroupedFields
      if (counters.size>0) {
        ret = new DontCodeStoreGroupedByEntities(groupBy, []);

        for (const aggregate of groupBy.aggregates) {
          let value;
          const counter=counters.get(aggregate.name as keyof T);
          if( counter!=null) {
            switch (aggregate.calculation) {
              case DontCodeStoreCalculus.COUNT:
                value=counter.count;
                break;
              case DontCodeStoreCalculus.SUM:
                value=counter.sum;
                break;
              case DontCodeStoreCalculus.AVERAGE:
                value=counter.sum / counter.count;
                break;
            }
          }
          ret.values?.push( new DontCodeStoreGroupedByValues(aggregate, value));
        }
        return ret.values!.length>0?ret:undefined;
      }
    }
    return ret;
  }
}

class Counters {
  sum=0;

  count=0;

  minimum: any;

  maximum: any;

  metaData = new DataTransformationInfo();
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

export class DontCodeStorePreparedEntities<T> {
  constructor(public sortedData:T[], public sortInfo?:DontCodeStoreSort, public groupedByEntities?:DontCodeStoreGroupedByEntities) {
  }
}

export class DontCodeStoreGroupedByEntities {
  constructor(public groupInfo:DontCodeStoreGroupby, public values?:DontCodeStoreGroupedByValues[]) {
    if (values==null)
      this.values=new Array<DontCodeStoreGroupedByValues>();
  }
}

export class DontCodeStoreGroupedByValues {
  constructor(public forAggregate:DontCodeStoreAggregate, public value:any) {
  }
}
