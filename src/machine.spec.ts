import { expect } from 'chai';
import 'mocha';
import { createState } from './state';
import { StateMachine } from './machine';

describe('StateMachine', () => {
  const createMachine = (setState1Initial: boolean, allowState2: boolean, action?: () => Promise<string>) => {
    const machine = new StateMachine('test');
    const allowedFrom = allowState2 ? ['state1'] : [];
    machine.registerState('state1', setState1Initial);
    machine.registerState('state2', allowedFrom, action);
    machine.registerState('state3', ['state2']);
    machine.registerState('state4', ['state3'], () => Promise.resolve(''));
    machine.registerState('state5', () => Promise.resolve(''), false);
    machine.registerState('state6', undefined, undefined, false);
    machine.registerState(createState('state7'));
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
      const machine = createMachine(false, true, () => {
        counter++;
        return Promise.resolve('');
      });
      await machine.trigger('state1');
      await machine.trigger('state2');
      expect(counter).to.eq(1);
    });

    it(`should advance to state returned from state's registered action`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve('state3'));
      await machine.trigger('state1');
      await machine.trigger('state2');
      const currentState = machine.currentState;
      expect(currentState).to.eq('state3');
    });

    it(`should throw error when a state's action returns an invalid state`, async () => {
      const machine = createMachine(false, true, () => Promise.resolve('state4'));
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
      machine.registerState('test', (s, a, b) => {
        calledWithPayload = a === arg1 && b === arg2;
        return Promise.resolve('');
      });
      await machine.trigger('test', arg1, arg2);
      expect(calledWithPayload).to.be.true;
    });
  });

  describe('canTrigger', () => {
    it('should return false when state does not exist', () => {
      const machine = createMachine(false, false);
      const result = machine.canTrigger('state_not_exists');
      expect(result).to.be.false;
    });

    it('should return false when current state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.trigger('state1');
      const result = machine.canTrigger('state2');
      expect(result).to.be.false;
    });

    it('should return true when current state is in allowedFrom', async () => {
      const machine = createMachine(false, true);
      await machine.trigger('state1');
      const result = machine.canTrigger('state2');
      expect(result).to.be.true;
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
});
