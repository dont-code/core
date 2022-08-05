import {StoreProviderHelper,} from '@dontcode/core';

describe('Store Provider Helper', () => {
  it('should correctly manage id fields', () => {

    StoreProviderHelper.clearConfigCache();

    let result = StoreProviderHelper.findSpecialFields("creation/entity/a", {
      name:"EntityA",
      fields: {
        "aa": {
          name: "_id",
          type:"Text"
        },
        "ab": {
          name: "name",
          type:"Text"
        }
      }
    });

    expect(result.idField).toEqual("_id");

    let listToTest:Array<any>=[{
      _id:454545,
      name:"Name1"
    }, {
      _id:76877,
      name:"Name2"
    }]
    let toStore = new Array(...listToTest);
    StoreProviderHelper.cleanUpDataBeforeSaving(toStore, result);
    expect(toStore[0]).toStrictEqual(listToTest[0]);

    result = StoreProviderHelper.findSpecialFields("creation/entity/b", {
      name:"EntityB",
      fields: {
        "ba": {
          name: "uniqueName",
          type:"Text"
        },
        "bb": {
          name: "firstName",
          type:"Text"
        }
      }
    });

    expect(result.idField).toEqual("uniqueName");

    listToTest=[{
      uniqueName:"454545",
      firstName:"Name1"
    }, {
      uniqueName:"76877",
      firstName:"Name2"
    }];

    StoreProviderHelper.cleanUpLoadedData(listToTest, result);
    expect(listToTest[0]._id).toStrictEqual(listToTest[0].uniqueName);

    toStore = new Array(...listToTest);
    StoreProviderHelper.cleanUpDataBeforeSaving(toStore, result);
    expect(toStore[0]._id).toBeUndefined();
    expect(toStore[1]._id).toBeUndefined();

    result = StoreProviderHelper.findSpecialFields("creation/entity/c", {
      name:"EntityC",
      fields: {
        "ca": {
          name: "otherIdentifier",
          type:"Text"
        },
        "cb": {
          name: "primaryIdentifier",
          type:"Text"
        }
      }
    });

    expect(result.idField).toEqual("primaryIdentifier");

    result = StoreProviderHelper.findSpecialFields("creation/entity/d", {
      name:"EntityD",
      fields: {
        "da": {
          name: "other",
          type:"Text"
        },
        "db": {
          name: "description",
          type:"Text"
        }
      }
    });

    expect(result.idField).toBeNull();

    listToTest=[{
      other:"454545",
      description:"Name1"
    }, {
      other:"76877",
      description:"Name2"
    }]
    toStore = new Array(...listToTest);
    StoreProviderHelper.cleanUpDataBeforeSaving(toStore, result);
    expect(toStore[0]).toStrictEqual(listToTest[0]);

  });

  it('should dynamically manage Id fields', () => {
    StoreProviderHelper.clearConfigCache();
    const result = StoreProviderHelper.findSpecialFields("creation/entity/d", {
      name:"EntityD",
      fields: {
        "da": {
          name: "other",
          type:"Text"
        },
        "db": {
          name: "description",
          type:"Text"
        }
      }
    });

    expect(result.idField).toBeNull();

    const listToTest=[{
      other:"Test",
      description:"Test2",
      "newField":"NewValue"
    }, {
      other:"Test",
      description:"Test2"
    }];

      // This will try to guess the id from the data itself
    StoreProviderHelper.cleanUpLoadedData(listToTest, result);

    expect(result.idField).toBeNull();

    StoreProviderHelper.cleanUpLoadedData([{
      other:"Test",
      description:"Test1",
      "id":"NewValue"
    }, {
      other:"Test",
      description:"Test2",
      "id":"NewValue"
    }], result);
    expect(result.idField).toBeNull();

    StoreProviderHelper.cleanUpLoadedData([{
      other:"Test",
      description:"Test1",
      "id":"NewValue"
    }, {
      other:"Test",
      description:"Test2",
      "id":"NewValue2"
    }], result);
    expect(result.idField).toStrictEqual("id");

  });
  }

);
