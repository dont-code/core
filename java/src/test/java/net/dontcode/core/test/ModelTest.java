package net.dontcode.core.test;

import com.fasterxml.jackson.core.JsonProcessingException;
import net.dontcode.core.Change;
import net.dontcode.core.DontCodeModelPointer;
import net.dontcode.core.MapOrString;
import net.dontcode.core.Models;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static net.dontcode.core.test.Utils.fromJsonToMap;

/**
 * Duplicates the tests of https://github.com/dont-code/core/blob/main/node/packages/core/src/lib/model/dont-code-model-manager.spec.ts
 */
public class ModelTest {

    @Test
    public void testCreateChange () {
        Change change = Utils.createTestChange(
                Change.ChangeType.ADD,
                "creation/entities",
                "a",
                "fields",
                "ab",
                """
                    {
                        name: "id",
                        type: "number",
                    }
                """,
                null
    );

    DontCodeModelPointer resultPointer = change.getPointer();

    Assertions.assertEquals("creation/entities/fields", resultPointer.getPositionInSchema());
    Assertions.assertEquals("creation/entities",resultPointer.getContainerPositionInSchema());

    }

    @Test
    public void itShouldSupportSimpleValueChanges () throws JsonProcessingException {
        MapOrString merged = new MapOrString();
        // Test creation of a simple property including its parent
        MapOrString result = Models.applyChange(
                merged,
                Utils.createTestChange(Change.ChangeType.ADD,
                        "creation",
                        null,
                        null,
                        null,
                        "TestName",
                        "name"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName"
                    }
                }"""
        );

        Assertions.assertTrue(merged == result);

        // Test creation of a simple property
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.ADD,
                        "creation",
                        null,
                        null,
                        null,
                        "TestApp",
                        "type"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "type": "TestApp"
                    }
                }""");

        // Test deletion of a simple property
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.DELETE,
                        "creation",
                        null,
                        null,
                        null,
                        null,
                        "type"
                )
        );
        checkModels(merged, """
                {
                  "creation": {
                        "name": "TestName"
                  }
                }""");

        // Test reset of a simple property
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.RESET,
                        "creation",
                        null,
                        null,
                        null,
                        "appli",
                        "type"
                )
        );

        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "type": "appli"
                    }
                }""");

        // Test creation of a simple property can create multiple subHierarchy
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.ADD,
                        "creation",
                        null,
                        "entities",
                        "a",
                        "TestEntity",
                        "name"
                )
        );
        checkModels(merged, """
                    {
                    "creation": {
                        "name": "TestName",
                        "type": "appli",
                        "entities": {
                            "a": {
                                "name":"TestEntity"
                            }
                        }
                    }
                }""");
        // Test move of a simple property generates creation of new parent and update of old parent
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/a/name",
                        null,
                        "creation",
                        null,
                        "entities",
                        "b",
                        "name"
                )
        );
        checkModels(merged, """
                    {
                    "creation": {
                        "name": "TestName",
                        "type": "appli",
                        "entities": {
                            "a": {},
                            "b": {
                                "name": "TestEntity"
                            }
                        }
                    }
                }""");

        // Test move of a simple property generates an update of both parents
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/b/name",
                        null,
                        "creation",
                        null,
                        "entities",
                        "a",
                        "name"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "type": "appli",
                    "entities": {
                        "a": {
                            "name": "TestEntity"
                            },
                        "b": {}
                        }
                    }
                }""");
    }

    @Test
    public void itShouldSupportArrayChangesByPosition () throws JsonProcessingException {
        // Test you can add an complete object as an element of to be created array
        MapOrString merged = new MapOrString();

        Models.applyChange(
                merged,
                Utils.createTestChange(Change.ChangeType.RESET,
                        "creation",
                        null,
                        null,
                        null,
                        "TestName",
                        "name"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName"
                    }
                }"""
        );
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(Change.ChangeType.ADD,
                        "creation",
                        null,
                        "entities",
                        "a", """
                                {
                                    "name": "TestEntityA",
                                    "from": "TestSourceA"
                                }""",
                        null)
        );

        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                            }
                        }
                    }
                }""");


        // Test you can add another element of an array
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(Change.ChangeType.ADD,
                        "creation",
                        null,
                        "entities",
                        "b", """
                                {
                                    "name": "TestEntityB",
                                    "from": "TestSourceB"
                                }""",
                        null)
        );

        checkModels(merged, """
                     {
                     "creation": {
                         "name": "TestName",
                         "entities": {
                             "a": {
                                 "name": "TestEntityA",
                                 "from": "TestSourceA"
                             },
                             "b": {
                                 "name": "TestEntityB",
                                 "from": "TestSourceB"
                             }
                         }
                     }
                }""");

        // Check the hierarchy is correctly managed when adding a complex object in an array
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.UPDATE,
                        "creation",
                        null,
                        "entities",
                        "b",
                        """
                                  {
                                   "name": "NewTestEntityB",
                                    "fields": {
                                        "aa": {
                                            "name": "TestFieldAA",
                                            "type": "int"
                                        },
                                        "ab": {
                                            "name": "TestFieldAB",
                                            "type": "int"
                                        }
                                    }
                                }""",
                        null)
        );

        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                        },
                        "b": {
                            "name": "NewTestEntityB",
                            "fields": {
                                "aa": {
                                    "name": "TestFieldAA",
                                    "type": "int"
                                },
                                "ab": {
                                    "name": "TestFieldAB",
                                    "type": "int"
                                    }
                                }
                            }
                        }
                    }
                }""");

        // Check the RESET of a complex object in a array
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.RESET,
                        "creation",
                        null,
                        "entities",
                        "b", """
                                {
                                    "name": "NewTestEntityB",
                                    "from": "TestSourceB"
                                }""",
                        null
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": { 
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                        },
                        "b": {
                            "name": "NewTestEntityB",
                            "from": "TestSourceB"
                        }
                    }
                }
                }""");

        // Check the element can be inserted anywhere in an array
        Change insertChange = Utils.createJsonTestChange(
                Change.ChangeType.ADD,
                "creation",
                null,
                "entities",
                "c", """
                        {
                            "name": "TestEntityC",
                            "from": "TestSourceC"
                        }""",
                null
        );
        insertChange.setBeforeKey("b");

        Models.applyChange(merged,
                insertChange);
        checkModels(merged, """
                    {
                    "creation": {
                        "name": "TestName",
                        "entities": {
                            "a": {
                                "name": "TestEntityA",
                                "from": "TestSourceA"
                                },
                            "c": {
                                "name": "TestEntityC",
                                "from": "TestSourceC"
                                },
                            "b": {
                                "name": "NewTestEntityB",
                                "from": "TestSourceB"
                            }
                        }
                    }
                }""");
        // Test the element has been inserted at the correct position
        Assertions.assertArrayEquals(new String[]{"a", "c", "b"}, merged.find("creation/entities").getMap().keySet().toArray());

        // Check one can DELETE an element in an array
        Models.applyChange(
                merged,
                Utils.createTestChange(Change.ChangeType.DELETE,
                        "creation", null, "entities", "c", null, null)
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                            },
                        "b": {
                            "name": "NewTestEntityB",
                            "from": "TestSourceB"
                            }
                        }
                    }
                }""");

        // Check one can MOVE elements inside an array
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/b",
                        "a",
                        "creation",
                        null,
                        "entities",
                        "b",
                        null
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "name": "NewTestEntityB",
                            "from": "TestSourceB"
                            },
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                            }
                        }
                    }
                }""");

        // Check one can move an item from one parent to another
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(Change.ChangeType.RESET,
                "",
                null,
                null,
                null,
                """
                {
                    "creation":{
                        "name": "TestName",
                        "entities":{
                            "a": {
                                "name": "TestEntityA",
                                "from":"TestSourceA"
                                },
                            "b": {
                                "name":"TestEntityB",
                                "fields":{
                                    "ab": {
                                        "name":"TestFieldAB",
                                        "type":"int"
                                    }
                                }
                            }
                        }
                    }
                }""",
                        null)
            );
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/b/fields/ab",
                        null,
                        "creation/entities",
                        "a",
                        "fields",
                        "aa",
                        null
                    )
                );

        checkModels(merged,
                """
                {
                "creation":{
                    "name":"TestName",
                    "entities":{
                        "a": {
                            "name":"TestEntityA",
                            "from":"TestSourceA",
                            "fields": {
                                "aa": {
                                    "name":"TestFieldAB",
                                    "type":"int"
                                    }
                                }
                            },
                        "b": {
                            "name":"TestEntityB",
                            "fields": {
                            }
                        }
                    }
                }
            }""");
    }

    @Test
    public void itShouldSupportArrayChangesBySubValue () throws JsonProcessingException {
        MapOrString merged = new MapOrString();
        Models.applyChange(merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.RESET,
                        "",
                        null,
                        null,
                        null,"""
                {
                "creation": {
                    "name": "TestName"
                    }
                }""",
                        null)
        );
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.ADD,
                        "",
                        null,
                        "creation",
                        null, """
                        {
                          "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                            }
                        }""",
        "entities"
      )
    );
    checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                        }
                    }
                }
                }""");

        // Test you can add another element of an array
   Models.applyChange(
           merged,
           Utils.createJsonTestChange(
                        Change.ChangeType.UPDATE,
                        "",
                        null,
                        "creation",
                        null, """
                        {
                           "b": {
                                "name": "TestEntityB",
                                "from": "TestSourceB"
                                }
                        }""",
                    "entities"
                )
    );

   checkModels(merged, """
                {
                    "creation": {
                        "name": "TestName",
                        "entities": {
                            "b": {
                                "name": "TestEntityB",
                                "from": "TestSourceB"
                                }
                        }
                    }
                }""");

        // Check the hierarchy is correctly managed when adding a complex object in an array
   Models.applyChange(
           merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.UPDATE,
                        "",
                        null,
                        "creation",
                        null, """
                        {
                            "b": {
                                "name": "NewTestEntityB",
                                "fields": {
                                    "aa": {
                                        "name": "TestFieldAA",
                                        "type": "int"
                                        },
                                    "ab": {
                                        "name": "TestFieldAB",
                                        "type": "int"
                                        }
                                    }
                                }
                            }""",
                    "entities"
      ));

      checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "name"  : "NewTestEntityB",
                            "fields": {
                                "aa": {
                                    "name": "TestFieldAA",
                                    "type": "int"
                                    },
                                "ab": {
                                    "name": "TestFieldAB",
                                    "type": "int"
                                    }
                                }
                            }
                        }
                    }
                }""");

        // Check the RESET of a complex object in a array generates the right events
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.RESET,
                        "creation",
                        null,
                        "entities",
                        null,
                        """
                                {
                                    "b": {
                                    "name": "NewTestEntityB",
                                    "from": "TestSourceB"
                                    }
                                }""",
                        null
                        )
    );
    checkModels(merged,"""
                {
                    "creation": {
                        "name": "TestName",
                        "entities": {
                            "b": {
                                "name": "NewTestEntityB",
                                "from": "TestSourceB"
                                }
                            }
                        }
                    }""");

        // Check one can move an item from one parent to another
    Models.applyChange(merged,
            Utils.createJsonTestChange( Change.ChangeType.RESET,
            "", null, null, null, """
            {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA"
                            },
                        "b": {
                            "name": "TestEntityB",
                            "fields": {
                                "ab": {
                                    "name": "TestFieldAB",
                                    "type": "int"
                                    }
                                }
                            }
                        }
                    }
    }""",null));

    Models.applyChange(
            merged,
                Utils.createMoveChange(
                        "creation/entities/b/fields",
                        null,
                        "creation",
                        null,
                        "entities",
                        "a",
                        "fields"
                )
        );

   checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "from": "TestSourceA",
                                "fields": {
                                    "ab": {
                                        "name": "TestFieldAB",
                                        "type": "int"
                                        }
                                    }
                                },
                        "b": {
                            "name": "TestEntityB"
                            }
                        }
                    }
    }""");
    }

    @Test
    public void itShouldSupportAdditionalTests () throws JsonProcessingException {
        MapOrString merged = new MapOrString();

        Models.applyChange(
                merged,
                Utils.createJsonTestChange(
                        Change.ChangeType.ADD,
                        "",
                        null,
                        null,
                        null, """
                        {
                            "name": "TestName",
                            "type": "TestApp"
                        }""",
        "creation"
      )
    );
    checkModels(merged, """
                {
                    "creation": {
                        "name": "TestName",
                        "type": "TestApp"
                        }
                }""");

   Models.applyChange(
           merged,
                Utils.createTestChange(
                        Change.ChangeType.ADD,
                        "creation/entities",
                        "a",
                        null,
                        null,
                        "TestEntity",
                        "name"
                )
        );
   checkModels(merged, """
                {
                    "creation": {
                        "name": "TestName",
                        "type": "TestApp",
                        "entities": {
                            "a": {
                                "name": "TestEntity"
                                }
                            }
                        }
                    }""");

   Models.applyChange(
           merged,
           Utils.createJsonTestChange(Change.ChangeType.ADD,"creation", null, "entities", null, """
                        {
                        "a": {
                            "name": "NewTestEntity",
                            "from": "OldSource"
                            }
                        }""",null)
    );
    checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "type": "TestApp",
                    "entities": {
                        "a": {
                            "name": "NewTestEntity",
                            "from": "OldSource"
                            }
                        }
                    }
                }""");

    Models.applyChange(
            merged,
            Utils.createJsonTestChange(Change.ChangeType.ADD, "creation", null, "entities", "a","""
                        {
                        "name": "NewTestEntity2",
                        "from": "NewSource"
                        }""", null)
    );
    checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "type": "TestApp",
                    "entities": {
                        "a": {
                            "name": "NewTestEntity2",
                            "from": "NewSource"
                            }
                        }
                    }
                }""");

   Models.applyChange(
           merged,
           Utils.createJsonTestChange(Change.ChangeType.ADD,"creation", null, "entities", "a", """
                        {
                        "name": "NewTestEntity2",
                        "from": "NewSource"
                        }""",null)
            );
   checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "type": "TestApp",
                    "entities": {
                        "a": {
                            "name": "NewTestEntity2",
                            "from": "NewSource"
                            }
                        }
                    }
                }""");

   Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "",
                null,null,null,
                """
                {
                "creation": {
                    "name": "TestName"
                        }
                }""", null));
   Models.applyChange(
           merged,
                Utils.createJsonTestChange(Change.ChangeType.ADD,
                        "creation", null, "entities", "b", """
                        {
                            "name": "TestEntity",
                            "from": "source1"
                        }""", null)
    );
   checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "name": "TestEntity",
                            "from": "source1"
                            }
                        }
                    }
                }""");

   Models.applyChange(
           merged,
                Utils.createTestChange(Change.ChangeType.ADD,
                        "creation",
                        null,
                        "entities",
                        "b",
                        "source2",
                        "from"
                )
        );
   checkModels(merged,"""
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "name": "TestEntity",
                            "from": "source2"
                            }
                        }
                    }
                }""");

   Models.applyChange(
           merged,
                Utils.createTestChange(
                        Change.ChangeType.ADD,
                        "creation",
                        null,
                        "entities",
                        "b",
                        "source2",
                        "from"
                )
        );
   checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "name": "TestEntity",
                            "from": "source2"
                            }
                        }
                    }
                }""");

        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "", null, null,null,
        """
                {
                "creation": {
                    "name": "TestName"
                }
                }""", null));
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(Change.ChangeType.ADD,"creation", null, "entities", null, """
                        {
                            "c": {"name": "TestEntity3" }
                        }""",null)
    );
    checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "c": {
                            "name": "TestEntity3"
                            }
                        }
                    }
                }""");

   Models.applyChange(
           merged,
           Utils.createJsonTestChange(Change.ChangeType.ADD,"creation", null, "entities", null, """
                        {
                            "c": { "name": "TestEntity4", "from": "whatever" }
                        }""", null)
    );
    checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities":{
                        "c": {
                            "name": "TestEntity4",
                            "from": "whatever"
                            }
                        }
                    }
                }""");

    Models.applyChange(
            merged,
            Utils.createJsonTestChange(Change.ChangeType.ADD,"creation", null, "screens", "c", """
                    {
                        "name": "TestScreen",
                        "components": {
                            "wx": { "name": "TestComp", "type": "List" },
                            "yz": { "name": "TestComp2" }
                            }
                    }""",null)
    );
    checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "c": {
                            "name": "TestEntity4",
                            "from": "whatever"
                            }
                    },
                   "screens": {
                        "c": {
                            "name": "TestScreen",
                            "components": {
                                "wx": {
                                    "name": "TestComp",
                                    "type": "List"
                                    },
                                "yz": {
                                    "name": "TestComp2"
                                    }
                                }
                            }
                        }
                    }
                }""");


        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "", null, null,null,
                """
                        {
                        "creation": {
                            "name": "TestName"
                            }
                        }""", null));
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.ADD,
                        "creation/screens",
                        "ab",
                        "components",
                        "cd",
                        "Search",
                        "name"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "screens": {
                        "ab": {
                            "components": {
                                "cd": {
                                    "name": "Search"
                                    }
                                }
                            }
                        }
                    }
                }""");

   Models.applyChange(
           merged,
           Utils.createTestChange(
                   Change.ChangeType.ADD,
                        "creation/screens",
                        "ab",
                        "components",
                        "ef",
                        "List",
                        "name"
                )
        );
   checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "screens": {
                        "ab": {
                            "components": {
                                "cd": {
                                    "name": "Search"
                                    },
                                "ef": {
                                    "name": "List"
                                    }
                                }
                            }
                        }
                    }
                }""");
    }

    @Test
    public void itShouldDeleteContentCorrectly () throws JsonProcessingException {
        MapOrString merged = new MapOrString();
        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "", null, null,null,
                """
                    {
                    "creation": {
                        "name": "TestName",
                        "type": "TestApp",
                        "entities": {
                            "a": {
                                "name": "TestEntityA",
                                "type": "boolean"
                                },
                            "b": {
                                "name": "TestEntityB",
                                "type": "string"
                                }
                            }
                        }
                    }""", null));
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.DELETE,
                        "creation",
                        null,
                        null,
                        null,
                        null,
                        "type"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "type": "boolean"
                            },
                        "b": {
                            "name": "TestEntityB",
                            "type": "string"
                            }
                        }
                    }
                }""");
        Models.applyChange(
                merged,
                Utils.createTestChange(Change.ChangeType.DELETE,"creation", null, "entities", "a", null, null)
        );
        checkModels(merged,
                """
                    {
                    "creation": {
                        "name": "TestName",
                        "entities": {
                            "b": {
                            "name": "TestEntityB",
                            "type": "string"
                                }
                            }
                        }
                    }""");
        Models.applyChange(
                merged,
                Utils.createTestChange(
                        Change.ChangeType.DELETE,
                        "creation",
                        null,
                        "entities",
                        "b", null,
                        "name"
                )
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName",
                    "entities": {
                        "b": {
                            "type": "string"
                            }
                        }
                    }
                }""");

        Models.applyChange(
                merged,
                Utils.createTestChange(Change.ChangeType.DELETE,"creation", null, "entities", null, null,null)
        );
        checkModels(merged, """
                {
                "creation": {
                    "name": "TestName"
                    }
                }""");
    }

    @Test
    public void itShouldMoveContentCorrectlyFromCommands () throws JsonProcessingException {
        MapOrString merged = new MapOrString();
        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "", null, null,null,
                """
                {
                "creation": {
                    "name": "TestName",
                    "type": "TestApp",
                    "entities": {
                        "a": {
                            "name": "TestEntityA",
                            "type": "boolean"
                            },
                        "b": {
                            "name": "TestEntityB",
                            "type": "string"
                            },
                        "c": {
                            "name": "TestEntityC",
                            "type": "numeric"
                            }
                        }
                    }
                }""", null));

        Assertions.assertArrayEquals(new String[]{"a", "b", "c"}, merged.find("creation/entities").getMap().keySet().toArray());
        // from a,b,c to b,a,c
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/b",
                        "a",
                        "creation",
                        null,
                        "entities",
                        "b",
                        null
                )
        );
        Assertions.assertArrayEquals(new String[]{"b", "a", "c"}, merged.find("creation/entities").getMap().keySet().toArray());
        // from b,a,c to b,c,a
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/c",
                        "a",
                        "creation",
                        null,
                        "entities",
                        "c",
                        null
                )
        );
        Assertions.assertArrayEquals(new String[]{"b", "c", "a"}, merged.find("creation/entities").getMap().keySet().toArray());
        // from b,c,a to c,a,b
        Models.applyChange(
                merged,
                Utils.createMoveChange(
                        "creation/entities/b",
                        null,
                        "creation",
                        null,
                        "entities",
                        "b",null
                )
        );
        Assertions.assertArrayEquals(new String[]{"c", "a", "b"}, merged.find("creation/entities").getMap().keySet().toArray());
    }

    @Test
    public void itShouldResetContentCorrectly () throws JsonProcessingException {
        MapOrString merged = new MapOrString();
        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET,
                "creation", null, null,null,
                null, null)
        );
        Assertions.assertTrue(merged.find("creation").isNull());

        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET, "creation", null,null,null, """
                { "type": "application", "name": "Name" }""", null));
        checkModels(merged, """
                {
                "creation": {
                    "type":"application",
                    "name":"Name"
                    }
                }""");

        Models.applyChange(merged, Utils.createJsonTestChange(Change.ChangeType.RESET, "creation", null,null,null, """
                {"type": "application", "name": "NameNew" }
                """, null));
        checkModels(merged, """
                {
                "creation": {
                    "type":"application",
                    "name":"NameNew"
                    }
                }""");


        merged = new MapOrString();
        Models.applyChange(
                merged,
                Utils.createJsonTestChange(Change.ChangeType.RESET, "", null,null,null, """
                        {
                            "creation": {
                                "name": "CreationName",
                                "entities": {
                                    "a": {
                                        "name": "entityA"
                                        },
                                    "b": {
                                        "name": "entityB"
                                        }
                                    }
                                }
                            }""", null)
    );
    checkModels(merged, """
                {
                "creation": {
                    "name": "CreationName",
                    "entities": {
                        "a": {
                            "name": "entityA"
                            },
                        "b": {
                            "name": "entityB"
                            }
                        }
                    }
                }""");
    }

    @Test
    public void itShouldLoadCorrectlyAComplexSession () throws URISyntaxException, IOException {
        URL url = Thread.currentThread().getContextClassLoader().getResource("sessions/complex-session.json");
        String testContent = Files.readString(Path.of (url.toURI()));

        MapOrString jsonContent =  new MapOrString(Utils.fromJsonToMap(testContent));
        MapOrString targetContent = new MapOrString();

        for (var key:jsonContent.getMap().keySet()) {
            var curContent = jsonContent.mapGetMap(key).get();
            Change newChange = new Change(Change.ChangeType.valueOf(curContent.get("type").toString()),
                    (String) curContent.get("position"), curContent.get("value"));
            Models.applyChange(targetContent, newChange);
        }
        Assertions.assertEquals(Models.findAtPosition(targetContent, "creation/entities/b/fields/a/name", false).getString(), "dsa");
    }

    protected void checkModels(Map<String, Object> merged, String jsonToCheck) throws JsonProcessingException {
        Assertions.assertEquals(fromJsonToMap(jsonToCheck),  merged );
    }

    protected void checkModels( MapOrString merged, String jsonToCheck) throws JsonProcessingException {
        Assertions.assertEquals(fromJsonToMap(jsonToCheck), merged.getMap() );
    }
}
