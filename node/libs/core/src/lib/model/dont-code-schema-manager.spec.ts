import { DontCode } from "@dontcode/core";
import dtcde = DontCode.dtcde;

describe('Schema Manager', () => {
  it('should work', () => {
    const mgr = dtcde.getSchemaManager()
    expect(mgr).toBeDefined();
  });
});
