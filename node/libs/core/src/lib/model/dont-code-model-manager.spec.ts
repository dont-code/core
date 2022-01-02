import {Subject} from "rxjs";
import {Change, ChangeType} from "../change/change";
import {dtcde} from "../globals";
import {DontCodeTestManager} from "../test/dont-code-test-manager";

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

  it('should still work in compatible asynchronous mode', () => {
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
  });

  function checkChanges(atomicChanges: Array<Change>, expected: Array<{ position: string; type: ChangeType, value?:any }>): void {
    atomicChanges.forEach((value, index) => {
      expect(value).toMatchObject (expected[index]);
    });
    expect(atomicChanges).toHaveLength(expected.length);
  }

  it('should support simple value changes', () => {
    const service = dtcde.getModelManager();
    service.resetContent({});
    let atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, null, null, "TestName", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName"
      }
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: ''},
      {type: ChangeType.ADD, position: 'creation'},
      {type: ChangeType.ADD, position: 'creation/name'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, null, null, "TestApp", "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp"
      }
    });
    checkChanges (atomicChanges,[
      {type: ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.ADD, position:'creation/type'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'a', "TestEntity", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            "name":"TestEntity"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type: ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/a'},
      {type:ChangeType.ADD, position:'creation/entities/a/name'}
    ]);
  });

  it('should support array changes by position', () => {
  });

  it('should support array changes by subValue', () => {
  });

  it('should support object updates by position', () => {
  });

  it('should support object updates by subValue', () => {
  });

  it('should add content correctly', () => {
    const service = dtcde.getModelManager();
    service.resetContent({});

    let atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation/entities", 'a', null, null, "TestEntity", "name"));
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
    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/a'},
      {type:ChangeType.ADD, position:'creation/entities/a/name'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', null, {
     "a": {
       name:'NewTestEntity',
       from:'OldSource'
     }
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "NewTestEntity",
            from: "OldSource"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities/a'},
      {type:ChangeType.UPDATE, position:'creation/entities/a/name'},
      {type:ChangeType.ADD, position:'creation/entities/a/from'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'a', {
        name:'NewTestEntity2',
        from:'NewSource'
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "NewTestEntity2",
            from: "NewSource"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities/a/name'},
      {type:ChangeType.UPDATE, position:'creation/entities/a/from'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'a', {
      name:'NewTestEntity2',
      from:'NewSource'
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp",
        entities: {
          "a": {
            name: "NewTestEntity2",
            from: "NewSource"
          }
        }
      }
    });
    checkChanges (atomicChanges,[]);

    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'b',
      {name: "TestEntity", from: "source1"}));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntity",
            from: "source1"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/b'},
      {type:ChangeType.ADD, position:'creation/entities/b/name'},
      {type:ChangeType.ADD, position:'creation/entities/b/from'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, "entities", "b", "source2", "from"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntity",
            from: "source2"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities/b/from'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, "entities", "b", "source2", "from"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "b": {
            name: "TestEntity",
            from: "source2"
          }
        }
      }
    });
    checkChanges (atomicChanges,[]);

    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, "entities", null,
      {"c": {name:"TestEntity3"}}));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "c": {
            name: "TestEntity3"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/c'},
      {type:ChangeType.ADD, position:'creation/entities/c/name'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, "entities", null,
      {"c": {name:"TestEntity4", from:'whatever'}}));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "c": {
            name: "TestEntity4",
            from: 'whatever'
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities/c'},
      {type:ChangeType.UPDATE, position:'creation/entities/c/name'},
      {type:ChangeType.ADD, position:'creation/entities/c/from'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'screens', 'c',
      {name:'TestScreen', components: {"wx": {name: "TestComp", type: "List"}, "yz": {name:"TestComp2"}}}));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          "c": {
            name: "TestEntity4",
            source: "whatever"
          }
        },
        screens: {
          "c": {
            name: "TestScreen",
            components: {
              "wx": {
                name: "TestComp",
                type: "List"
              },
              "yz": {
                name: "TestComp2"
              }
            }
          }
        }
      }
    });

    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/screens'},
      {type:ChangeType.ADD, position:'creation/screens/c'},
      {type:ChangeType.ADD, position:'creation/screens/c/name'},
      {type:ChangeType.ADD, position:'creation/screens/c/components'},
      {type:ChangeType.ADD, position:'creation/screens/c/components/wx'},
      {type:ChangeType.ADD, position:'creation/screens/c/components/wx/name'},
      {type:ChangeType.ADD, position:'creation/screens/c/components/wx/type'},
      {type:ChangeType.ADD, position:'creation/screens/c/components/yz'},
      {type:ChangeType.ADD, position:'creation/screens/c/components/yz/name'},
    ]);

    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation/screens", 'ab', "components", "cd", "Search", "name"));
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
    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/screens'},
      {type:ChangeType.ADD, position:'creation/screens/ab'},
      {type:ChangeType.ADD, position:'creation/screens/ab/components'},
      {type:ChangeType.ADD, position:'creation/screens/ab/components/cd'},
      {type:ChangeType.ADD, position:'creation/screens/ab/components/cd/name'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation/screens", 'ab', "components", "ef", "List", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        screens: {
          "ab": {
            components: {
              "cd": {
                name: "Search"
              },
              "ef": {
                name: "List"
              }
            }
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.ADD, position:'creation/screens/ab/components/ef'},
      {type:ChangeType.ADD, position:'creation/screens/ab/components/ef/name'}
    ]);

  });

  it('should delete content correctly', () => {
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
