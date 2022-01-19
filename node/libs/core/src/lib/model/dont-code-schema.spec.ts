import * as DontCode from "@dontcode/core";
import dtcde = DontCode.dtcde;
import { DontCodeSchemaEnum, DontCodeSchemaObject, DontCodeSchemaRoot } from "./dont-code-schema-item";
import PluginConfig = DontCode.PluginConfig;
import {DontCodeModelPointer} from "@dontcode/core";

describe('Model Pointer', () => {
  it('should calculate subItem properly', () => {
    const rootPtr = new DontCodeModelPointer('','', undefined,undefined,'');

    expect(rootPtr).toBeDefined();
    const sub = rootPtr.subPropertyPointer('creation');

    expect(sub.position).toEqual('creation');
    expect(sub.positionInSchema).toEqual('creation');

  });

});
