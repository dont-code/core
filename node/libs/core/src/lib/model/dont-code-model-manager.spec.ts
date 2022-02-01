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

  function checkChanges(atomicChanges: Array<Change>, expected: Array<{ position: string; type: ChangeType, oldPosition?:string }>): void {
    atomicChanges.forEach((value, index) => {
      expect(index).toBeLessThan(expected.length);
      expect(value).toMatchObject (expected[index]);
    });
    expect(atomicChanges).toHaveLength(expected.length);
  }

  it('should support simple value changes', () => {
    const service = dtcde.getModelManager();
      // Test creation of a simple property including its parent
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

    // Test creation of a simple property generates an update of its parent
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, null, null, "TestApp", "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp"
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.ADD, position: 'creation/type'}
    ]);

    // Test deletion of a simple property generates an update of its parent
    atomicChanges = service.applyChange(DontCodeTestManager.createDeleteChange("creation", null, null, null, "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: 'TestName'
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.DELETE, position: 'creation/type'}
    ]);

    // Test reset of a simple property generates an update of its parent
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange(ChangeType.RESET, "creation", null, null, null, "appli", "type"));
    expect(service.getContent()).toEqual({
      creation: {
        name: 'TestName',
        type: 'appli'
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.RESET, position:'creation/type'}
    ]);

    // Test creation of a simple property can create multiple subHierarchy
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'a', "TestEntity", "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: 'appli',
        entities: {
          "a": {
            "name":"TestEntity"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position: 'creation'},
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/a'},
      {type:ChangeType.ADD, position:'creation/entities/a/name'}
    ]);

    // Test move of a simple property generates creation of new parent and update of old parent
    atomicChanges = service.applyChange(DontCodeTestManager.createMoveChange("creation/entities/a/name",null, "creation", null, 'entities', 'b', "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: 'appli',
        entities: {
          "a": {
          },
          "b": {
            "name":"TestEntity"
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/b'},
      {type:ChangeType.UPDATE, position:'creation/entities/a'},
      {type:ChangeType.MOVE, position:'creation/entities/b/name', oldPosition:'creation/entities/a/name'}
    ]);


    // Test move of a simple property generates an update of both parents
    atomicChanges = service.applyChange(DontCodeTestManager.createMoveChange("creation/entities/b/name",null, "creation", null, 'entities', 'a', "name"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: 'appli',
        entities: {
          "a": {
            "name":"TestEntity"
          },
          "b": {
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:'creation/entities/a'},
      {type:ChangeType.UPDATE, position:'creation/entities/b'},
      {type:ChangeType.MOVE, position:'creation/entities/a/name', oldPosition:'creation/entities/b/name'}
    ]);
  });

  it('should support array changes by position', () => {
    const service = dtcde.getModelManager();
    // Test you can add an complete object as an element of to be created array
    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    let atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'a', {
      name: 'TestEntityA',
      from: 'TestSourceA'
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation'},
      {type: ChangeType.ADD, position: 'creation/entities'},
      {type: ChangeType.ADD, position: 'creation/entities/a'},
      {type: ChangeType.ADD, position: 'creation/entities/a/name'},
      {type: ChangeType.ADD, position: 'creation/entities/a/from'},
    ]);

    // Test you can add another element of an array
    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation", null, 'entities', 'b', {
      name: 'TestEntityB',
      from: 'TestSourceB'
    }));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'TestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities'},
      {type: ChangeType.ADD, position: 'creation/entities/b'},
      {type: ChangeType.ADD, position: 'creation/entities/b/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/from'},
    ]);


      // Check the hierarchy is correctly managed when adding a complex object in an array
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange(ChangeType.UPDATE, "creation", null, 'entities', 'b', {
      name: 'NewTestEntityB',
      fields: {
        'aa': {
          'name':'TestFieldAA',
          'type':'int'
        },
        'ab': {
          'name':'TestFieldAB',
          'type':'int'
        }
      }
    }));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'NewTestEntityB',
            fields: {
              'aa': {
                'name':'TestFieldAA',
                'type':'int'
              },
              'ab': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities/b'},
      {type: ChangeType.UPDATE, position: 'creation/entities/b/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/from'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa/type'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab/type'}
    ]);

    // Check the RESET of a complex object in a array generates the right events
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange( ChangeType.RESET,"creation",null, 'entities', 'b', {
      name:'NewTestEntityB',
      from:'TestSourceB'
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'NewTestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities'},
      {type: ChangeType.RESET, position: 'creation/entities/b'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa/type'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab/type'},
      {type: ChangeType.ADD, position: 'creation/entities/b/from'},
    ]);

    // Check the element can be inserted anywhere in an array
    const insertChange = DontCodeTestManager.createTestChange("creation", null, 'entities', 'c', {
      name: 'TestEntityC',
      from: 'TestSourceC'
    });
    insertChange.beforeKey='b';

    atomicChanges = service.applyChange(insertChange);
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'c': {
            name:'TestEntityC',
            from:'TestSourceC'
          },
          'b': {
            name:'NewTestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    // Test the element has been inserted at the correct position
    expect(Object.keys(service.getContent()['creation']['entities'])).toStrictEqual(['a','c','b']);


    // Check one can DELETE an element in an array
    atomicChanges = service.applyChange(DontCodeTestManager.createDeleteChange( "creation", null, 'entities', 'c'));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'NewTestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities'},
      {type: ChangeType.DELETE, position: 'creation/entities/c'},
      {type: ChangeType.DELETE, position: 'creation/entities/c/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/c/from'},
    ]);

    // Check one can MOVE elements inside an array
    atomicChanges = service.applyChange(DontCodeTestManager.createMoveChange( "creation/entities/b","a","creation", null, 'entities', 'b'));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'b': {
            name:'NewTestEntityB',
            from:'TestSourceB'
          },
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities'},
      {type: ChangeType.MOVE, position: 'creation/entities/b', oldPosition:'creation/entities/b'},
      {type: ChangeType.MOVE, position: 'creation/entities/b/name', oldPosition:'creation/entities/b/name'},
      {type: ChangeType.MOVE, position: 'creation/entities/b/from', oldPosition:'creation/entities/b/from'}
    ]);

      // Check one can move an item from one parent to another
    service.resetContent({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'TestEntityB',
            fields: {
              'ab': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          }
        }
      }
    });
    atomicChanges = service.applyChange(DontCodeTestManager.createMoveChange( "creation/entities/b/fields/ab",null,"creation/entities", 'a', 'fields', 'aa'));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA',
            fields: {
              'aa': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          },
          'b': {
            name:'TestEntityB',
            fields: {}
          }
        }
      }
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities/a'},
      {type: ChangeType.ADD, position: 'creation/entities/a/fields'},
      {type: ChangeType.UPDATE, position: 'creation/entities/b/fields'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/aa', oldPosition:'creation/entities/b/fields/ab'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/aa/name', oldPosition:'creation/entities/b/fields/ab/name'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/aa/type', oldPosition:'creation/entities/b/fields/ab/type'}
    ]);

  });

  it('should support array changes by subValue', () => {
    const service = dtcde.getModelManager();
    // Test you can add an complete object as an element of to be created array
    service.resetContent({
      creation: {
        name: "TestName"
      }
    });
    let atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("", null, 'creation', null, {
      a: {
        name: 'TestEntityA',
        from: 'TestSourceA'
      }
    }, "entities"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation'},
      {type: ChangeType.ADD, position: 'creation/entities'},
      {type: ChangeType.ADD, position: 'creation/entities/a'},
      {type: ChangeType.ADD, position: 'creation/entities/a/name'},
      {type: ChangeType.ADD, position: 'creation/entities/a/from'},
    ]);

    // Test you can add another element of an array
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange(ChangeType.UPDATE,"", null, 'creation', null, {
      b: {
        name: 'TestEntityB',
        from: 'TestSourceB'
      }
    }, "entities"));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'b': {
            name:'TestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities'},
      {type: ChangeType.DELETE, position: 'creation/entities/a'},
      {type: ChangeType.DELETE, position: 'creation/entities/a/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/a/from'},
      {type: ChangeType.ADD, position: 'creation/entities/b'},
      {type: ChangeType.ADD, position: 'creation/entities/b/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/from'},
    ]);


    // Check the hierarchy is correctly managed when adding a complex object in an array
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange(ChangeType.UPDATE, "", null, 'creation', null, {
      'b': {
        name: 'NewTestEntityB',
        fields: {
          'aa': {
            'name':'TestFieldAA',
            'type':'int'
          },
          'ab': {
            'name':'TestFieldAB',
            'type':'int'
          }
        }
      }
    }, "entities"));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'b': {
            name:'NewTestEntityB',
            fields: {
              'aa': {
                'name':'TestFieldAA',
                'type':'int'
              },
              'ab': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities/b'},
      {type: ChangeType.UPDATE, position: 'creation/entities/b/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/from'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/aa/type'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab/name'},
      {type: ChangeType.ADD, position: 'creation/entities/b/fields/ab/type'}
    ]);

    // Check the RESET of a complex object in a array generates the right events
    atomicChanges = service.applyChange(DontCodeTestManager.createAnyChange( ChangeType.RESET,"creation",null, 'entities', null, {
      'b': {
        name:'NewTestEntityB',
        from:'TestSourceB'
        }
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'b': {
            name:'NewTestEntityB',
            from:'TestSourceB'
          }
        }
      },
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities/b'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/aa/type'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab/name'},
      {type: ChangeType.DELETE, position: 'creation/entities/b/fields/ab/type'},
      {type: ChangeType.ADD, position: 'creation/entities/b/from'},
    ]);

    // Check one can move an item from one parent to another
    service.resetContent({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA'
          },
          'b': {
            name:'TestEntityB',
            fields: {
              'ab': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          }
        }
      }
    });
    atomicChanges = service.applyChange(DontCodeTestManager.createMoveChange( "creation/entities/b/fields",null,"creation", null, 'entities', 'a', 'fields' ));

    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        entities: {
          'a': {
            name:'TestEntityA',
            from:'TestSourceA',
            fields: {
              'ab': {
                'name':'TestFieldAB',
                'type':'int'
              }
            }
          },
          'b': {
            name:'TestEntityB'
          }
        }
      }
    });
    checkChanges(atomicChanges, [
      {type: ChangeType.UPDATE, position: 'creation/entities/a'},
      {type: ChangeType.UPDATE, position: 'creation/entities/b'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields',oldPosition:'creation/entities/b/fields'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/ab', oldPosition:'creation/entities/b/fields/ab'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/ab/name', oldPosition:'creation/entities/b/fields/ab/name'},
      {type: ChangeType.MOVE, position: 'creation/entities/a/fields/ab/type', oldPosition:'creation/entities/b/fields/ab/type'}
    ]);
  });

  it('should support additional tests', () => {
    const service = dtcde.getModelManager();
    service.resetContent({});

    let atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("", null, null, null, {
      name: "TestName",
      type: "TestApp"
    }, "creation"));
    expect(service.getContent()).toEqual({
      creation: {
        name: "TestName",
        type: "TestApp"
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.UPDATE, position:''},
      {type:ChangeType.ADD, position:'creation'},
      {type:ChangeType.ADD, position:'creation/name'},
      {type:ChangeType.ADD, position:'creation/type'}
    ]);

    atomicChanges = service.applyChange(DontCodeTestManager.createTestChange("creation/entities", 'a', null, null, "TestEntity", "name"));
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
      {type:ChangeType.UPDATE, position:'creation'},
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
      {type:ChangeType.UPDATE, position:'creation'},
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
      {type:ChangeType.UPDATE, position:'creation'},
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
            from: "whatever"
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
      {type:ChangeType.UPDATE, position:'creation'},
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
      {type:ChangeType.UPDATE, position:'creation'},
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
      {type:ChangeType.UPDATE, position:'creation/screens/ab/components'},
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
    service.applyChange(DontCodeTestManager.createDeleteChange("creation", null, null, null, "type"));
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
    service.applyChange(DontCodeTestManager.createDeleteChange("creation", null, "entities", "a"));
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
    service.applyChange(DontCodeTestManager.createDeleteChange("creation", null, "entities", "b", "name"));
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
    service.applyChange(DontCodeTestManager.createDeleteChange("creation", null, "entities", null));
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
    // from a,b,c to b,a,c
    service.applyChange(DontCodeTestManager.createMoveChange("creation/entities/b", "a", "creation", null, "entities", "b"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["b", "a", "c"]);
    // from b,a,c to b,c,a
    service.applyChange(DontCodeTestManager.createMoveChange("creation/entities/c", "a", "creation", null, "entities", "c"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["b", "c", "a"]);
    // from b,c,a to c,a,b
    service.applyChange(DontCodeTestManager.createMoveChange("creation/entities/b", null, "creation", null, "entities", "b"));
    expect(Object.keys(service.getContent().creation.entities)).toStrictEqual(["c", "a", "b"]);
  });

  it('should reset content correctly', () => {
    const service = dtcde.getModelManager();
    service.applyChange(new Change(ChangeType.RESET, "creation",null));
    expect(service.getContent()).toEqual({
      creation: null
    });

    const toReset={ type:'application', name:'Name'};
    service.applyChange(new Change(ChangeType.RESET, "creation", toReset ));
    expect(service.getContent()).toEqual({
      creation: toReset
    });

    const toRoot={ creation: {type:'application', name:'NameNew'}};
    service.applyChange(new Change(ChangeType.RESET, "",toRoot ));
    expect(service.getContent()).toEqual(toRoot);

    service.resetContent(null);
    const atomicChanges = service.applyChange (new Change (ChangeType.RESET, '', {
      creation: {
        name:'CreationName',
        entities: {
          'a': {
            name:'entityA'
          },
          'b': {
            name:'entityB'
          }
        }
      }
    }));
    expect(service.getContent()).toEqual({
      creation: {
        name:'CreationName',
        entities: {
          'a': {
            name:'entityA'
          },
          'b': {
            name:'entityB'
          }
        }
      }
    });
    checkChanges (atomicChanges,[
      {type:ChangeType.RESET, position:''},
      {type:ChangeType.ADD, position:'creation'},
      {type:ChangeType.ADD, position:'creation/name'},
      {type:ChangeType.ADD, position:'creation/entities'},
      {type:ChangeType.ADD, position:'creation/entities/a'},
      {type:ChangeType.ADD, position:'creation/entities/a/name'},
      {type:ChangeType.ADD, position:'creation/entities/b'},
      {type:ChangeType.ADD, position:'creation/entities/b/name'}
    ]);

  });
});
