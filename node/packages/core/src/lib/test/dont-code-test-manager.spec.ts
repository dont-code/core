import { DontCodeTestManager } from './dont-code-test-manager';
import { dtcde } from '../dontcode';
import {firstValueFrom} from "rxjs";

describe('Test Manager', () => {
  it('should generate correct changes', () => {
    const change = DontCodeTestManager.createTestChange(
      'creation/entities',
      'a',
      'fields',
      'ab',
      {
        name: 'id',
        type: 'number',
      }
    );

    const resultPointer = change.pointer;
    expect(resultPointer?.positionInSchema).toBe('creation/entities/fields');
    expect(resultPointer?.containerPositionInSchema).toBe('creation/entities');
  });

  it ('should set dummy provider', (done) => {
    DontCodeTestManager.addDummyProviderFromContent("creation/entities/a", [
      {
        "name": "Dummy1",
        "value": 123
      },
      {
        "name": "Dummy2",
        "value": 1656

      }
    ]);
    const ret = dtcde.getStoreManager().getProvider("creation/entities/a")?.searchEntities("creation/entities/a");
    expect(ret).toBeTruthy();
    if (ret != null) {
      firstValueFrom(ret).then(result => {
        expect(result).toHaveLength(2);
        const anyResult=result[1] as any;
        expect(anyResult?.name).toEqual("Dummy2");
        expect(anyResult?.value).toStrictEqual(1656);
        done();
      })
    }
  });

  it ('should properly send wait result value', (done) => {
    DontCodeTestManager.waitUntilTrueAndEmit(() => {
      return false;
    }, 20, 3).then (value => {
      if (value) done("Error should return false");

      let count=0;
      return DontCodeTestManager.waitUntilTrueAndEmit( () => {
        count++;
        if( count < 5) return false;
        else  return true;
      }, 20, 10).then(value => {
          if (!value) done ("Error should return true");
          done();
        }
      )
    })
  });

  it ('should properly wait ', (done) => {
    let count=0;
    DontCodeTestManager.waitUntilTrue(() => {
        count++;
        if( count < 5) return false;
        else  return true;
      }, done,20, 10);
  });

});
