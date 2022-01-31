import { expect } from 'chai';
import 'mocha';
import { createState } from './state';
import { StateMachine } from './machine';

describe('StateMachine', () => {
  const createMachine = (setState1Initial: boolean, allowState2: boolean, action?: () => string) => {
    const machine = new StateMachine('test');
    const allowedFrom = allowState2 ? ['state1'] : [];
    machine.registerState('state1', setState1Initial);
    machine.registerState('state2', allowedFrom, action);
    machine.registerState('state3', ['state2']);
    machine.registerState('state4', () => '');
    machine.registerState('state5', () => '', false);
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
      expect(machine.currentState?.name).to.eq('state1');
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

  describe('gotoState', () => {
    it('should allow moving to state when previous state is in allowedFrom"', async () => {
      const machine = createMachine(false, true);
      machine.states[1].action = undefined;
      await machine.start();
      await machine.gotoState('state1');
      await machine.gotoState('state2');
      expect(machine.currentState?.name).to.eq('state2');
    });

    it('should allow moving to state when previous state is null', async () => {
      const machine = createMachine(false, false);
      await machine.gotoState('state1');
      expect(machine.currentState?.name).to.eq('state1');
    });

    it('should not allow moving to state when previous state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.gotoState('state1');
      await machine.gotoState('state2');
      expect(machine.currentState?.name).to.eq('state1');
    });

    it('should return true when state advanced successfully', async () => {
      const machine = createMachine(false, false);
      const result = await machine.gotoState('state1');
      expect(result).to.be.true;
    });

    it('should return false when state did NOT advance successfully', async () => {
      const machine = createMachine(false, false);
      await machine.gotoState('state1');
      const result = await machine.gotoState('state2');
      expect(result).to.be.false;
    });

    it('should run registered action when advancing state', async () => {
      let counter = 0;
      const machine = createMachine(false, true, () => {
        counter++;
        return '';
      });
      await machine.gotoState('state1');
      await machine.gotoState('state2');
      expect(counter).to.eq(1);
    });

    it(`should advance to state returned from state's registered action`, async () => {
      const machine = createMachine(false, true, () => 'state3');
      await machine.gotoState('state1');
      await machine.gotoState('state2');
      expect(machine.currentState?.name).to.eq('state3');
    });
  });

  describe('canGotoState', () => {
    it('should return false when current state is NOT in allowedFrom', async () => {
      const machine = createMachine(false, false);
      await machine.gotoState('state1');
      const result = machine.canGotoState('state2');
      expect(result).to.be.false;
    });

    it('should return true when current state is in allowedFrom', async () => {
      const machine = createMachine(false, true);
      await machine.gotoState('state1');
      const result = machine.canGotoState('state2');
      expect(result).to.be.true;
    });
  });
});
