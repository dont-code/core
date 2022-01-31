import {DontCodeSchemaObject, DontCodeSchemaRoot, DontCodeTestManager, dtcde} from "@dontcode/core";

describe('Test Manager', () => {
  it('should generate correct changes', () => {
    let change = DontCodeTestManager.createTestChange('creation/entities', 'a', 'fields', 'ab', {
      "name": "id",
      "type": "number"
    });

    const resultPointer = change.pointer;
    expect(resultPointer?.positionInSchema).toBe('creation/entities/fields');
    expect(resultPointer?.containerPositionInSchema).toBe('creation/entities');
  });
});
