import {
  DontCodeStoreAggregate,
  DontCodeStoreCriteria,
  DontCodeStoreCriteriaOperator,
  DontCodeStoreGroupby,
  DontCodeStoreSort
} from "./dont-code-store-manager";
import {DataTransformationInfo, DontCodeModelManager} from "../model/dont-code-model-manager";
import {DontCodeSchemaItem} from "../model/dont-code-schema-item";
import {DontCodeModelPointer} from "../model/dont-code-schema";
import {DontCodeGroupOperationType} from "../globals";

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

  /**
   * Calculates sum, avg, min or max values per group
   * @param values
   * @param groupBy
   * @param modelMgr
   * @param position
   * @param item
   */
  static calculateGroupedByValues<T>(values: T[], groupBy: DontCodeStoreGroupby, modelMgr?: DontCodeModelManager, position?: DontCodeModelPointer, item?:DontCodeSchemaItem):DontCodeStoreGroupedByEntities|undefined {
      // We are counting per different value of the groupedBy Item
    if ((groupBy!=null) && (groupBy.display!=null)) {
      let fieldToGroupBy=groupBy.of as keyof T;
      if (groupBy.show!=null) fieldToGroupBy=groupBy.show.valueOf() as keyof T;

      const counters=new Map<any,Map<keyof T, Counters>> ();
      let lastGroupDelimiter:any;
      let oneGroupOfCounters=new Map<keyof T, Counters>();

      const fieldsRequired = groupBy.getRequiredListOfFields() as Set<keyof T>;
      for (const value of values) {
        if (value[fieldToGroupBy]!=lastGroupDelimiter) {   // We change the group
          lastGroupDelimiter=value[fieldToGroupBy];
          const storedGroupOfCounters=counters.get(lastGroupDelimiter);
          if( storedGroupOfCounters==null) {
            oneGroupOfCounters = new Map<keyof T, Counters>();
            counters.set(lastGroupDelimiter, oneGroupOfCounters);
          }else {
            oneGroupOfCounters = storedGroupOfCounters;
          }
        }

        for (const field of fieldsRequired) {
          let counter=oneGroupOfCounters?.get(field);
          if( counter==null) {
            counter = new Counters();
            oneGroupOfCounters.set(field, counter);
          }

          const valSrc=value[field];
          const val=valSrc;
          if (valSrc!=null) {
              // If it's an object, we need to set the calculated values as the object itself
            if ((typeof valSrc === 'object') &&  (!(valSrc instanceof Date)) && (modelMgr!=null)) {
              if( counter.sum==null) counter.sum=structuredClone(valSrc);
              else {
                counter.sum=modelMgr.modifyValues(counter.sum, valSrc, counter.metaData,
                  (first, second) => {
                    if ((first!=null) && (second!=null))
                      return first + second;
                    else if (first == null) {
                      return second;
                    } else if (second==null) {
                      return first;
                    }
                  },
                  position, item);
              }
              const value=modelMgr.extractValue(valSrc, counter.metaData,position, item);
              if( counter.minimum==null)  { counter.minimum=valSrc; counter.minAsValue=value}
              else {
                const minValue=counter.minAsValue;
                if ((value!=null) && ((minValue==null) || (value < minValue)) ) { counter.minimum = valSrc; counter.minAsValue=value }
              }

              if( counter.maximum==null) { counter.maximum=valSrc; counter.maxAsValue=value;}
              else {
                const maxValue=counter.maxAsValue;

                if ((value!=null) && ((maxValue==null) || (value > maxValue)))
                  { counter.maximum = valSrc; counter.maxAsValue = value;}
              
              }

              if (value!=null) {
                counter.count++;
              }

            } else if (typeof val === 'number') {
              if( counter.sum==null) counter.sum=0;
              counter.sum=counter.sum+val;
              if( (counter.minimum==null) || (val < counter.minimum))
                { counter.minimum=valSrc; counter.minAsValue=valSrc as number;}
              if( (counter.maximum==null) || (val > counter.maximum))
                { counter.maximum=valSrc; counter.maxAsValue=valSrc as number;}
              counter.count++;
            } else if ((val instanceof Date) && (!isNaN(val.getTime()))) {
              counter.sum=null;
              if ((counter.minimum==null) || (val.valueOf() < counter.minimum.valueOf())) {
                counter.minimum=valSrc;
              }
              if ((counter.maximum==null) || (val.valueOf() > counter.maximum.valueOf())) {
                counter.maximum=valSrc;
              }
              counter.count++;
            } else {  // strings
              counter.count++;
            }
          }
        }
      }

      // Now that we have all the counters, let's generate the GroupedFields
      let ret: DontCodeStoreGroupedByEntities|undefined;
      if (counters.size>0) {
        ret = new DontCodeStoreGroupedByEntities(groupBy, new Map<any,DontCodeStoreGroupedByValues[]>);
        for (const groupKey of counters.keys()) {
          const group=counters.get(groupKey)!;

          for (const aggregate of Object.values(groupBy.display)) {
            let value;
            const counter = group.get(aggregate.of as keyof T);
            if (counter != null) {
              switch (aggregate.operation) {
                case DontCodeGroupOperationType.Count:
                  value = counter.count;
                  break;
                case DontCodeGroupOperationType.Sum:
                  value = counter.sum;
                  break;
                case DontCodeGroupOperationType.Average: {
                  if ((counter.sum==null) || (counter.count==0)) value=null;
                  else if ((typeof counter.sum === 'object') &&  (!(counter.sum instanceof Date)) && (modelMgr!=null)) {
                    value = modelMgr.applyValue(structuredClone(counter.sum),
                      modelMgr.extractValue(counter.sum, counter.metaData, position, item)/counter.count,
                      counter.metaData, undefined, position, item);
                  } else value = counter.sum / counter.count;
                }
                  break;
                case DontCodeGroupOperationType.Minimum:
                  value = counter.minimum;
                  break;
                case DontCodeGroupOperationType.Maximum:
                  value = counter.maximum;
                  break;
              }
              let listOfValues= ret.values?.get(groupKey);
              if (listOfValues==null) {
                listOfValues = new Array<DontCodeStoreGroupedByValues>();
                  ret.values?.set(groupKey, listOfValues);
              }
              listOfValues.push(new DontCodeStoreGroupedByValues(aggregate, value));
            }
          }
        }
        return ret.values!.size>0?ret:undefined;
      }
    }
    return undefined;
  }
}

class Counters {
  sum:any;

  count=0;

  minimum: any;
  minAsValue: number | null = null;

  maximum: any;
  maxAsValue: number | null = null;

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
  constructor(public groupInfo:DontCodeStoreGroupby, public values?:Map<any,DontCodeStoreGroupedByValues[]>) {
    if (values==null)
      this.values=new Map<any,DontCodeStoreGroupedByValues[]>();
  }
}

export class DontCodeStoreGroupedByValues {
  constructor(public forAggregate:DontCodeStoreAggregate, public value:any) {
  }
}
