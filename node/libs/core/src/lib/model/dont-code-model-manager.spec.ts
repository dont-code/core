import {Subject} from "rxjs";
import { Change, ChangeType } from "../change/change";
import {dtcde} from "../globals";
import { DontCodeTestManager } from "../test/dont-code-test-manager";

describe('Model Manager', () => {
  it('should find the element at any position', () => {
    const service = dtcde.getModelManager();
    service.resetContent({
      creation: {
        name: "Test1",
        type: "application",
        entities: {
          "aaaa": {
            name: "Entity1",
            fields: {
              "aaab": {
                name: "Field1",
                type: "string"
              }
            }
          },
          "aaac": {
            name: 'Entity2',
            fields: {
              "aaad": {
                name: 'Name',
                type: 'boolean'
              }
            }
          }
        },
        screens: {
          "aaae": {
            name: "Screen1"
          },
          "aaaf": {
            name: "Screen2"
          }
        }
      }
    });
    expect(service.findAtPosition('creation')).toHaveProperty('name', 'Test1');
    expect(service.findAtPosition('creation/entities/aaaa')).toHaveProperty('name', 'Entity1');
    expect(service.findAtPosition('creation/entities/aaaa/')).toHaveProperty('name', 'Entity1');

    expect(service.findAtPosition('creation/entities/aaaa/fields/aaab')).toHaveProperty('name', 'Field1');
    expect(service.findAtPosition('creation/screens')).toHaveProperty('aaae', {"name": "Screen1"});
    expect(service.findAtPosition('creation/entities/ERROR')).toBeFalsy();

  });

  it('should manage properties target', () => {
    const service = dtcde.getModelManager();
    service.resetContent({
      creation: {
        name: "Test2",
        type: "application",
        entities: {
          "aaaa": {
            name: "Entity1",
            from: "Source1",
            fields: {
              "aaab": {
                name: "Field1",
                type: "string"
              }
            }
          },
          "aaac": {
            name: 'Entity2',
            fields: {
              "aaad": {
                name: 'Name',
                type: 'boolean'
              }
            }
          },
          "aaba": {
            name: 'Entity3',
            from: "WrongSource",
            fields: {
              "aabb": {
                name: 'Name',
                type: 'string'
              }
            }
          }
        },
        sources: {
          "aaae": {
            name: "Source1",
            type: "Rest",
            url: "https://test-url.com"
          },
          "aaag": {
            name: "Source2",
            type: "File",
            path: "$home/docs/test.txt"
          },
        }
      }
    });

      // First check the queries are correct
    const queryResult1 = service.queryModelToArray("$.creation.entities.*");
    expect(queryResult1).toHaveLength(3);

    //const queryResult2 = service.queryModelToArray('$.creation.entities[?(@.name==="Entity2")]');

    const queryResult2 = service.queryModelToSingle('$.creation.entities[?(@.name==="Entity2")]');
    expect(queryResult2).toHaveProperty('fields');

    const entity1 = service.findAtPosition('creation/entities/aaaa');
    expect(entity1).toHaveProperty('from', 'Source1');
    const sources = service.findAllPossibleTargetsOfProperty('from', 'creation/entities/aaaa');
    expect(sources).toHaveLength(2);
    expect(sources[0].type).toEqual("Rest");
    expect(sources[0].url).toBeTruthy();

    let source = service.findTargetOfProperty('from', 'creation/entities/aaaa');
    expect(source).toBeTruthy();
    expect(source.type).toEqual("Rest");

    source = service.findTargetOfProperty('from', 'creation/entities/aaac');
    expect(source).toBeFalsy();
    source = service.findTargetOfProperty('from', 'creation/entities/aaad');
    expect(source).toBeFalsy();

  });

  it('should update content correctly from commands', () => {
    const service = dtcde.getModelManager();
    service.resetContent({});
    const source = new Subject<Change>();
    service.receiveUpdatesFrom(source);
    source.next(DontCodeTestManager.createTestChange("creation", null, null, null, "TestName", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName"
      }
    });
    source.next(DontCodeTestManager.createTestChange("creation", null, null, null, "TestApp", "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp"
      }
    });

    source.next(DontCodeTestManager.createTestChange("creation/entities", 'a', null, null, "TestEntity", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "TestEntity"
          }
        }
      }
    });

    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    source.next(DontCodeTestManager.createTestChange("creation", null, 'entities', 'b',
      {name: "TestEntity", type: "string"}));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntity",
            type: "string"
          }
        }
      }
    });

    source.next(DontCodeTestManager.createTestChange("creation", null, "entities", "b", "number", "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntity",
            type: "number"
          }
        }
      }
    });

    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    source.next(DontCodeTestManager.createTestChange("creation/screens", 'ab', "components", "cd", "Search", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        screens: {
          "ab": {
            components: {
              "cd": {
                name: "Search"
              }
            }
          }
        }
      }
    });
  });

  it('should delete content correctly from commands', () => {
    const service = dtcde.getModelManager();
    service.resetContent({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "TestEntityA",
            type: "boolean"
          },
          "b": {
            name: "TestEntityB",
            type: "string"
          }
        }
      }
    });
    const source = new Subject<Change>();
    service.receiveUpdatesFrom(source);
    source.next(DontCodeTestManager.createDeleteChange("creation", null, null, null, "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "a": {
            name: "TestEntityA",
            type: "boolean"
          },
          "b": {
            name: "TestEntityB",
            type: "string"
          }
        }
      }
    });
    source.next(DontCodeTestManager.createDeleteChange("creation", null, "entities", "a"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntityB",
            type: "string"
          }
        }
      }
    });
    source.next(DontCodeTestManager.createDeleteChange("creation", null, "entities", "b", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            type: "string"
          }
        }
      }
    });
    source.next(DontCodeTestManager.createDeleteChange("creation", null, "entities", null));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName"
      }
    });

  });

  it('should move content correctly from commands', () => {
    const service = dtcde.getModelManager();
    service.resetContent({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "TestEntityA",
            type: "boolean"
          },
          "b": {
            name: "TestEntityB",
            type: "string"
          },
          "c": {
            name: "TestEntityC",
            type: "numeric"
          }
        }
      }
    });
    const start = Object.keys(service.getContent().creation.entities);
    expect(start).toEqual(["a", "b", "c"]);
    const source = new Subject<Change>();
    service.receiveUpdatesFrom(source);
    // from a,b,c to b,a,c
    source.next(DontCodeTestManager.createMoveChange("creation/entities/b", "a", "creation", null, "entities", "b"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["b", "a", "c"]);
    // from b,a,c to b,c,a
    source.next(DontCodeTestManager.createMoveChange("creation/entities/c", "a", "creation", null, "entities", "c"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["b", "c", "a"]);
    // from b,c,a to c,a,b
    source.next(DontCodeTestManager.createMoveChange("creation/entities/b", null, "creation", null, "entities", "b"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["c", "a", "b"]);
  });

  it('should reset content correctly from commands', () => {
    const service = dtcde.getModelManager();
    //service.resetContent({});
    const source = new Subject<Change>();
    service.receiveUpdatesFrom(source);
    source.next(new Change(ChangeType.RESET, "creation",null));
    expect(service.getContent()).toEqual({
      creation: null
    });

    const toReset={ type:'application', name:'Name'};
    source.next(new Change(ChangeType.RESET, "creation", toReset ));
    expect(service.getContent()).toEqual({
      creation: toReset
    });

    const toRoot={ creation: {type:'application', name:'NameNew'}};
    source.next(new Change(ChangeType.RESET, "/",toRoot ));
    expect(service.getContent()).toEqual(toRoot);
  });
});
