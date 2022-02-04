import { expect } from 'chai';
import 'mocha';
import { createState } from './state';
import { StateMachine } from './machine';
import { StateAction } from './interfaces';

describe('StateMachine', () => {
  const createMachine = (setState1Initial: boolean, allowState2: boolean, action?: StateAction) => {
    const machine = new StateMachine('test');
    const allowedFrom = allowState2 ? ['state1'] : [];
    machine.registerState('state1', setState1Initial);
    if (!!action) machine.registerStateWithAction('state2', allowedFrom, action);
    else machine.registerState('state2', allowedFrom);
    machine.registerState('state3', ['state2'], false);

    machine.registerState('state4');
    machine.registerState('state5', ['state4'], false);

    machine.registerStateWithAction('state6', () => Promise.resolve({ nextState: '' }));
    machine.registerStateWithAction('state7', ['state6'], () => Promise.resolve({ nextState: '' }));
    machine.registerStateWithAction('state8', () => Promise.resolve({ nextState: '' }));
    machine.registerStateWithAction(
      'state9',
      () => Promise.resolve({ nextState: '' }),
      () => Promise.resolve(false),
      false
    );
    machine.registerStateWithAction(
      'state10',
      () => Promise.resolve({ nextState: '' }),
      () => Promise.resolve(false),
      false
    );
    machine.registerStateWithAction(
      'state11',
      ['state10'],
      () => Promise.resolve({ nextState: '' }),
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
      expect(errorThrown).to.be.true;
    });

    it('should start at specified initial state', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const currentState = machine.currentState;
      expect(currentState).to.eq('state1');
    });

    it('should throw error when state already registered as initial', async () => {
      const machine = createMachine(true, false);
      let errorThrown = false;
      try {
        machine.registerState('state99', true);
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
  });

  describe('trigger', () => {
    it('should allow moving to state when previous state is in allowedFrom"', async () => {
      const machine = createMachine(false, true);
      (machine as any).states[1].action = undefined;
      await machine.start();
      await machine.trigger('state1');
      await machine.trigger('state2');
      expect(machine.currentState).to.eq('state2');
    });

    it('should allow moving to state when previous state is null', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const currentState = machine.currentState;
      expect(currentState).to.eq('state1');
    });

    it('should not allow moving to state when previous state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      await machine.trigger('state2');
      const currentState = machine.currentState;
      expect(currentState).to.eq('state1');
    });

    it('should not allow moving to state registered with allowedFrom none', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const result = await machine.trigger('state_from_none');
      expect(result).to.be.false;
    });

    it('should return true when state advanced successfully', async () => {
      const machine = createMachine(false, false);
      const result = await machine.trigger('state1');
      expect(result).to.be.true;
    });

    it('should return false when state did NOT advance successfully', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const result = await machine.trigger('state2');
      expect(result).to.be.false;
    });

    it('should run registered action when advancing state', async () => {
      let counter = 0;
      let calledWithMachine = false;
      const machine = createMachine(false, true, ctx => {
        counter++;
        calledWithMachine = ctx.machine === machine;
        return Promise.resolve({ nextState: '' });
      });
      await machine.trigger('state1');
      await machine.trigger('state2');
      expect(counter).to.eq(1);
      expect(calledWithMachine).to.be.true;
    });

    it(`should advance to state returned from state's registered action`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve({ nextState: 'state3' }));
      await machine.trigger('state1');
      await machine.trigger('state2');
      const currentState = machine.currentState;
      expect(currentState).to.eq('state3');
    });

    it(`should throw error when a state's action returns an invalid state`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve({ nextState: 'state99' }));
      await machine.trigger('state1');
      let errorThrown = false;
      try {
        await machine.trigger('state2');
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });

    it('should use specified args to run the action', async () => {
      const machine = createMachine(false, false);
      const arg1 = { data: 'test-1' };
      const arg2 = { data: 'test-2' };
      let calledWithPayload = false;
      machine.registerStateWithAction('test', (ctx, a, b) => {
        calledWithPayload = a === arg1 && b === arg2;
        return Promise.resolve({ nextState: '' });
      });
      await machine.trigger('test', arg1, arg2);
      expect(calledWithPayload).to.be.true;
    });

    it(`should return false when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerStateWithAction(
        'test',
        () => Promise.resolve({ nextState: '' }),
        () => Promise.resolve(false)
      );
      const result = await machine.trigger('test');
      expect(result).to.be.false;
    });

    it(`should not run state's action when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      let actionTriggered = false;
      machine.registerStateWithAction(
        'test',
        () => {
          actionTriggered = true;
          return Promise.resolve({ nextState: '' });
        },
        () => Promise.resolve(false)
      );
      await machine.trigger('test');
      expect(actionTriggered).to.be.false;
    });

    it(`should not advance to state when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerStateWithAction(
        'test',
        () => Promise.resolve({ nextState: '' }),
        () => Promise.resolve(false)
      );
      await machine.trigger('test');
      expect(machine.currentState).to.eq('');
    });

    it(`should set machine's data to data returned from state's action`, async () => {
      const machine = createMachine(false, false);
      const dataToReturn = { data: 'returned data' };
      machine.registerStateWithAction('test', () => Promise.resolve({ nextState: '', data: dataToReturn }));
      await machine.trigger('test');
      expect(machine.data).to.eql(dataToReturn);
    });
  });

  describe('canTrigger', () => {
    it('should return false when state does not exist', async () => {
      const machine = createMachine(false, false);
      const result = await machine.canTrigger('state_not_exists');
      expect(result).to.be.false;
    });

    it('should return false when current state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const result = await machine.canTrigger('state2');
      expect(result).to.be.false;
    });

    it('should return true when current state is in allowedFrom', async () => {
      const machine = createMachine(false, true);
      await machine.trigger('state1');
      (machine as any).states[1].canTrigger = undefined;
      const result = await machine.canTrigger('state2');
      expect(result).to.be.true;
    });

    it(`should return false when state's canTrigger returns false`, async () => {
      const machine = createMachine(false, false);
      machine.registerStateWithAction(
        'test',
        () => Promise.resolve({ nextState: '' }),
        () => Promise.resolve(false)
      );
      const result = await machine.canTrigger('test');
      expect(result).to.be.false;
    });

    it(`should return true when state's canTrigger returns true`, async () => {
      const machine = createMachine(false, false);
      machine.registerStateWithAction(
        'test',
        () => Promise.resolve({ nextState: '' }),
        () => Promise.resolve(true)
      );
      const result = await machine.canTrigger('test');
      expect(result).to.be.true;
    });

    it('should use specified args to run the action', async () => {
      const machine = createMachine(false, false);
      const arg1 = { data: 'test-1' };
      const arg2 = { data: 'test-2' };
      let calledWithPayload = false;
      machine.registerStateWithAction(
        'test',
        () => Promise.resolve({ nextState: '' }),
        (ctx, a, b) => {
          calledWithPayload = a === arg1 && b === arg2;
          return Promise.resolve(true);
        }
      );
      await machine.canTrigger('test', arg1, arg2);
      expect(calledWithPayload).to.be.true;
    });
  });

  describe('getStates', () => {
    it('should create a deep copy of states', () => {
      const machine = createMachine(false, false);
      const states = (machine as any).states;
      const result = machine.getStates();
      expect(result).not.to.eq(states);
      for (let i = 0; i < result.length; i++) {
        expect(result[i]).not.to.eq(states[i]);
        expect(result[i]).to.eql(states[i]);
      }
    });
  });

  describe('currentStateObject', () => {
    it('should return cloned current state', async () => {
      const machine = createMachine(true, false);
      await machine.start();
      const state = (machine as any).currentStateObj;
      expect(machine.currentStateObject).not.to.eq(state);
      expect(machine.currentStateObject).to.eql(state);
    });

    it('should return null when no current state', async () => {
      const machine = createMachine(false, false);
      await machine.start();
      expect(machine.currentStateObject).to.be.null;
    });
  });
});
