import { DontCodeModelPointer } from './dont-code-schema';

describe('Model Pointer', () => {
  it('should calculate subItem properly', () => {
    const rootPtr = new DontCodeModelPointer('', '', undefined, undefined, '');

    expect(rootPtr).toBeDefined();
    const sub = rootPtr.subPropertyPointer('creation');

    expect(sub.position).toEqual('creation');
    expect(sub.positionInSchema).toEqual('creation');
  });

  it('should manage pointer parenting', () => {
    const base=new DontCodeModelPointer('a/b/c', 'a/b/c');

    expect(base.isParentOf('a/b/c/d/e')).toBeTruthy();
    expect(base.isParentOf('a/b/c/d/e', true)).toBeFalsy();
    expect(base.isParentOf('a/b/c/d')).toBeTruthy();
    expect(base.isParentOf('a/b/c/d', true)).toBeTruthy();
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
