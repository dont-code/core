import {Change, ChangeType} from '../change/change';
import {dtcde} from '../dontcode';
import {DontCodeChangeManager} from '../change/dont-code-change-manager';
import {DontCodeModel} from '../model/dont-code-model';
import {Subscription} from "rxjs";

describe('Change Manager', () => {

  let changeMgr: DontCodeChangeManager;

  beforeEach(() => {
    changeMgr = dtcde.getChangeManager();
    changeMgr.reset();
  });

    it('should filter properly', () => {
    let subscriptions = new Subscription();
    const notified = jest.fn();
    try {
      subscriptions.add(changeMgr.receiveCommands('creation/screens', 'name').subscribe(
        notified
      ));
      let ret = changeMgr.pushChange (new Change (ChangeType.UPDATE, 'creation/name', 'NewName'));
      expect(notified).toHaveBeenCalledTimes(0);
      expect(ret).toEqual (false);

      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/a/name', 'NewName'));
      expect(notified).toHaveBeenCalledTimes(1);
      expect(ret).toEqual (true);
      subscriptions.unsubscribe();

      subscriptions = new Subscription();
      subscriptions.add(changeMgr.receiveCommands('creation/screens').subscribe(change => {
          notified();
        }

      ));
      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/b', {name:"NewName"}));
      expect(notified).toHaveBeenCalledTimes(5);
      expect(ret).toEqual (true);
      ret = changeMgr.pushChange (new Change (ChangeType.UPDATE, 'creation/screens/b/name', 'NewName'));
      expect(notified).toHaveBeenCalledTimes(6);
      expect(ret).toEqual (true);
      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/b/components/b', {type:"edit"}));
      expect(notified).toHaveBeenCalledTimes(10);
      expect(ret).toEqual (true);
      subscriptions.unsubscribe();

      subscriptions = new Subscription();
      subscriptions.add(changeMgr.receiveCommands('creation/screens/?').subscribe( change => {
          notified();
        }
      ));
      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/a/name', 'NewName'));
      expect(notified).toHaveBeenCalledTimes(11); // Called because the init value is sent, but the pushChange does not trigger anything
      expect(ret).toEqual (false);  //
      ret = changeMgr.pushChange (new Change (ChangeType.DELETE, 'creation/screens/b', null));
      expect(notified).toHaveBeenCalledTimes(13);
      expect(ret).toEqual (true);
      subscriptions.unsubscribe();

      subscriptions = new Subscription();
      subscriptions.add(changeMgr.receiveCommands('creation/screens/?', 'name').subscribe(
        notified
      ));
      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/a/name', 'NewName'));
      expect(notified).toHaveBeenCalledTimes(15);
      expect(ret).toEqual (true);
      ret = changeMgr.pushChange (new Change (ChangeType.DELETE, 'creation/screens/b', null));
      expect(notified).toHaveBeenCalledTimes(15);
      expect(ret).toEqual (false);
      ret = changeMgr.pushChange (new Change (ChangeType.ADD, 'creation/screens/b/components/c/type', 'view'));
      expect(notified).toHaveBeenCalledTimes(15);
      expect(ret).toEqual (false);
    } finally {
      subscriptions.unsubscribe();
      changeMgr.close();
    }
  });

  it('support reset properly', () => {
    const subscriptions = new Subscription();
    const notified = waitableJestFn(3);
    const notifiedQuestionMark = waitableJestFn(3);

    const ret=changeMgr.pushChange (new Change (ChangeType.RESET, '', {}));
    expect(ret).toEqual(false);

    try {
      subscriptions.add(changeMgr.receiveCommands('creation', 'name').subscribe( value => {
          notified();
        }
      ));
      subscriptions.add(changeMgr.receiveCommands('creation/entities', 'name').subscribe( value => {
          notified();
        }
      ));
      subscriptions.add(changeMgr.receiveCommands('creation/entities/?').subscribe(value => {
          notifiedQuestionMark();
        }
      ));

      const ret=changeMgr.pushChange (new Change (ChangeType.RESET, '', {
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
      notified.waitUntilComplete();
      expect(notified).toHaveBeenCalledTimes(3);
      notifiedQuestionMark.waitUntilComplete();
      expect(notifiedQuestionMark).toHaveBeenCalledTimes(3);
      expect(ret).toEqual(true);
    } finally {
      subscriptions.unsubscribe();
      changeMgr.close();
    }
  });

  it('should notify new listeners', (done) => {
    const subscriptions = new Subscription();
    const notified = waitableJestFn(1);
    const ret=changeMgr.pushChange(new Change(ChangeType.RESET, "creation/entities/a", {name:'TestName'}));
    expect(ret).toEqual(false);  // As no listeners were defined, for now there are no changes notified

    try {
      subscriptions.add(changeMgr.receiveCommands(DontCodeModel.APP_ENTITIES, DontCodeModel.APP_ENTITIES_NAME_NODE).subscribe(
        notified
      ));
      subscriptions.add(changeMgr.receiveCommands('creation/entities/?', DontCodeModel.APP_ENTITIES_NAME_NODE).subscribe(
        notified
      ));
      subscriptions.add(changeMgr.receiveCommands('creation/entities/?', undefined).subscribe(
        notified
      ));
      notified.waitUntilComplete();
      // Despite being set after, the subcriptions must have received the notification
      expect(notified).toHaveBeenCalledTimes(3);
      done();
    } finally {
      subscriptions.unsubscribe();
      changeMgr.close();
    }
  });

});

// Standard code to wait for a number of calls before testing the result
type WaitableMock = jest.Mock & {
  waitUntilComplete(): Promise<void>
}

export const waitableJestFn = (times: number): WaitableMock => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let _resolve: Function
  const promise = new Promise<void>(resolve => _resolve = resolve)

  let i = 0
  const mock = jest.fn(() => {
    // debug('mock is called', i, times)
    if (++i >= times)
      _resolve()
  }) as WaitableMock // force casting

  mock.waitUntilComplete = () => promise

  return mock
}

