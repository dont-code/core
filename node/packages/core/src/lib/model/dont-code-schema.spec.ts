import * as DontCode from '@dontcode/core';
import dtcde = DontCode.dtcde;
import {
  DontCodeSchemaEnum,
  DontCodeSchemaObject,
  DontCodeSchemaRoot,
} from './dont-code-schema-item';
import PluginConfig = DontCode.PluginConfig;
import { DontCodeModelPointer } from '@dontcode/core';

describe('Model Pointer', () => {
  it('should calculate subItem properly', () => {
    const rootPtr = new DontCodeModelPointer('', '', undefined, undefined, '');

    expect(rootPtr).toBeDefined();
    const sub = rootPtr.subPropertyPointer('creation');

    expect(sub.position).toEqual('creation');
    expect(sub.positionInSchema).toEqual('creation');
  });

  it('should calculate next item', () => {
    const testPosition = 'creation/screens/a/components/b';
    expect(DontCodeModelPointer.nextItemAndPosition(testPosition, 0)).toEqual({
      pos: 7,
      value: 'creation',
    });
    let result = DontCodeModelPointer.nextItemAndPosition(
      testPosition,
      'creation'.length
    );
    expect(result).toEqual({ pos: 15, value: 'screens' });
    result = DontCodeModelPointer.nextItemAndPosition(
      testPosition,
      result.pos + 1
    );
    expect(result).toEqual({ pos: 17, value: 'a' });
    result = DontCodeModelPointer.nextItemAndPosition(
      testPosition,
      result.pos + 1
    );
    expect(result).toEqual({ pos: 28, value: 'components' });

    expect(
      DontCodeModelPointer.nextItemAndPosition(
        testPosition,
        'creation/screens/a/'.length
      )
    ).toEqual({ pos: 28, value: 'components' });
    expect(
      DontCodeModelPointer.nextItemAndPosition(
        testPosition,
        'creation/screens/a/components'.length
      )
    ).toEqual({ pos: 30, value: 'b' });
    expect(
      DontCodeModelPointer.nextItemAndPosition(
        testPosition,
        'creation/screens/a/components/'.length
      )
    ).toEqual({ pos: 30, value: 'b' });
  });
});
