import { createState } from './state';
import { StateMachine } from './machine';
import { StateAction } from './interfaces';

describe('StateMachine', () => {
  const createMachine = (setState1Initial: boolean, allowState2: boolean, action?: StateAction) => {
    const machine = new StateMachine('test');
    const allowedFrom = allowState2 ? ['state1'] : [];
    machine.registerState('state1', setState1Initial);
    if (!!action) machine.registerState('state2', allowedFrom, action);
    else machine.registerState('state2', allowedFrom);
    machine.registerState('state3', ['state2'], false);

    machine.registerState('state4');
    machine.registerState('state5', ['state4'], false);

    machine.registerState('state6', () => Promise.resolve({ nextStateName: '' }));
    machine.registerState('state7', ['state6'], () => Promise.resolve({ nextStateName: '' }));
    machine.registerState('state8', () => Promise.resolve({ nextStateName: '' }));
    machine.registerState(
      'state9',
      () => Promise.resolve({ nextStateName: '' }),
      () => Promise.resolve(false),
      false
    );
    machine.registerState(
      'state10',
      () => Promise.resolve({ nextStateName: '' }),
      () => Promise.resolve(false),
      false
    );
    machine.registerState(
      'state11',
      ['state10'],
      () => Promise.resolve({ nextStateName: '' }),
      () => Promise.resolve(false),
      false
    );
    machine.registerState(createState('state_from_none', 'none'));
    return machine;
  };

  describe('registerState', () => {
    it('should throw error when state name already registered', () => {
      const machine = createMachine(false, false);
      let errorThrown = false;
      try {
        machine.registerState('state1');
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).toBeTrue();
    });

    it('should start at specified initial state', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const currentState = machine.currentStateName;
      expect(currentState).toStrictEqual('state1');
    });

    it('should throw error when state already registered as initial', async () => {
      const machine = createMachine(true, false);
      let errorThrown = false;
      try {
        machine.registerState('state99', true);
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).toBeTrue();
    });
  });

  describe('trigger', () => {
    it('should allow moving to state when previous state is in allowedFrom"', async () => {
      const machine = createMachine(false, true);
      (machine as any).states[1].action = undefined;
      await machine.start();
      await machine.trigger('state1');
      await machine.trigger('state2');
      expect(machine.currentStateName).toStrictEqual('state2');
    });

    it('should allow moving to state when previous state is null', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const currentState = machine.currentStateName;
      expect(currentState).toStrictEqual('state1');
    });

    it('should not allow moving to state when previous state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      await machine.trigger('state2');
      const currentState = machine.currentStateName;
      expect(currentState).toStrictEqual('state1');
    });

    it('should not allow moving to state registered with allowedFrom none', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const result = await machine.trigger('state_from_none');
      expect(result).toBeFalse();
    });

    it('should return true when state advanced successfully', async () => {
      const machine = createMachine(false, false);
      const result = await machine.trigger('state1');
      expect(result).toBeTrue();
    });

    it('should return false when state did NOT advance successfully', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const result = await machine.trigger('state2');
      expect(result).toBeFalse();
    });

    it('should run registered action when advancing state', async () => {
      let counter = 0;
      let calledWithMachine = false;
      const machine = createMachine(false, true, ctx => {
        counter++;
        calledWithMachine = ctx.machine === machine;
        return Promise.resolve({ nextStateName: '' });
      });
      await machine.trigger('state1');
      await machine.trigger('state2');
      expect(counter).toStrictEqual(1);
      expect(calledWithMachine).toBeTrue();
    });

    it(`should advance to state returned from state's registered action`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve({ nextStateName: 'state3' }));
      await machine.trigger('state1');
      await machine.trigger('state2');
      const currentState = machine.currentStateName;
      expect(currentState).toStrictEqual('state3');
    });

    it(`should throw error when a state's action returns an invalid state`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve({ nextStateName: 'state99' }));
      await machine.trigger('state1');
      let errorThrown = false;
      try {
        await machine.trigger('state2');
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).toBeTrue();
    });

    it('should use specified args to run the action', async () => {
      const machine = createMachine(false, false);
      const arg1 = { data: 'test-1' };
      const arg2 = { data: 'test-2' };
      let calledWithPayload = false;
      machine.registerState('test', (ctx, a, b) => {
        calledWithPayload = a === arg1 && b === arg2;
        return Promise.resolve({ nextStateName: '' });
      });
      await machine.trigger('test', arg1, arg2);
      expect(calledWithPayload).toBeTrue();
    });

    it(`should return false when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerState(
        'test',
        () => Promise.resolve({ nextStateName: '' }),
        () => Promise.resolve(false)
      );
      const result = await machine.trigger('test');
      expect(result).toBeFalse();
    });

    it(`should not run state's action when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      let actionTriggered = false;
      machine.registerState(
        'test',
        () => {
          actionTriggered = true;
          return Promise.resolve({ nextStateName: '' });
        },
        () => Promise.resolve(false)
      );
      await machine.trigger('test');
      expect(actionTriggered).toBeFalse();
    });

    it(`should not advance to state when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerState(
        'test',
        () => Promise.resolve({ nextStateName: '' }),
        () => Promise.resolve(false)
      );
      await machine.trigger('test');
      expect(machine.currentStateName).toStrictEqual('');
    });

    it(`should pass data returned from state's action to following action`, async () => {
      const machine = createMachine(false, false);
      const dataToReturn = { data: 'returned data' };
      machine.registerState('test', () => Promise.resolve({ nextStateName: 'test100', data: dataToReturn }));
      let returnedData: any = null;
      machine.registerState('test100', ['test'], (ctx, data) => {
        returnedData = data;
        return Promise.resolve({ nextStateName: '' });
      });
      await machine.trigger('test');
      expect(returnedData).toEqual(dataToReturn);
    });
  });

  describe('canTrigger', () => {
    it('should return false when state does not exist', async () => {
      const machine = createMachine(false, false);
      const result = await machine.canTrigger('state_not_exists');
      expect(result).toBeFalse();
    });

    it('should return false when current state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const result = await machine.canTrigger('state2');
      expect(result).toBeFalse();
    });

    it('should return true when current state is in allowedFrom', async () => {
      const machine = createMachine(false, true);
      await machine.trigger('state1');
      (machine as any).states[1].canTrigger = undefined;
      const result = await machine.canTrigger('state2');
      expect(result).toBeTrue();
    });

    it(`should return false when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerState(
        'test',
        () => Promise.resolve({ nextStateName: '' }),
        () => Promise.resolve(false)
      );
      const result = await machine.canTrigger('test');
      expect(result).toBeFalse();
    });

    it(`should return true when state's canTrigger returns true`, async () => {
      const machine = createMachine(false, false);
      machine.registerState(
        'test',
        () => Promise.resolve({ nextStateName: '' }),
        () => Promise.resolve(true)
      );
      const result = await machine.canTrigger('test');
      expect(result).toBeTrue();
    });

    it('should use specified args to run the action', async () => {
      const machine = createMachine(false, false);
      const arg1 = { data: 'test-1' };
      const arg2 = { data: 'test-2' };
      let calledWithPayload = false;
      machine.registerState(
        'test',
        () => Promise.resolve({ nextStateName: '' }),
        (ctx, a, b) => {
          calledWithPayload = a === arg1 && b === arg2;
          return Promise.resolve(true);
        }
      );
      await machine.canTrigger('test', arg1, arg2);
      expect(calledWithPayload).toBeTrue();
    });
  });

  describe('getStates', () => {
    it('should create a deep copy of states', () => {
      const machine = createMachine(false, false);
      const states = (machine as any).states;
      const result = machine.getStates();
      expect(result).not.toStrictEqual(states); // !==
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).not.toBe(states[i]); // !==
        expect(result[i].name).toEqual(states[i].name); // ===
        expect(result[i].allowedFrom).toEqual(states[i].allowedFrom); // ==
      }
    });
  });

  describe('currentStateObject', () => {
    it('should return cloned current state', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const state = (machine as any).currentStateObj;
      expect(machine.currentState).not.toBe(state); // !==
      expect(machine.currentState?.name).toStrictEqual(state.name); // ===
      expect(machine.currentState?.allowedFrom).toEqual(state.allowedFrom); // ==
    });

    it('should return null when no current state', async () => {
      const machine = createMachine(false, false);
      await machine.start();
      expect(machine.currentState).toBeNull();
    });
  });
});
