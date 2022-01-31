import { createState, State } from './state';

export class StateMachine {
  constructor(public name: string) {}

  readonly states: State[] = [];
  currentState: State | null = null;
  initialState: string | undefined;

  registerState(state: State, setAsInitial?: boolean);
  registerState(name: string, setAsInitial?: boolean);
  registerState(name: string, allowedFrom?: string[], setAsInitial?: boolean);
  registerState(name: string, action?: () => string, setAsInitial?: boolean);
  registerState(name: string, allowedFrom?: string[], action?: () => string, setAsInitial?: boolean);
  registerState(stateOrName: State | string, arg2?: any, arg3?: any, arg4?: boolean) {
    let state: State = stateOrName as any;
    let initial = false;
    let actionToUse: () => string = arg3 as any;
    if (typeof stateOrName === 'string') {
      let allowedFrom: string[] = undefined as any;
      if (typeof arg2 === 'boolean') {
        initial = arg2 === true;
      } else if (typeof arg2 === 'function') {
        actionToUse = arg2;
      } else if (typeof arg2 === 'object') {
        allowedFrom = arg2;
      }
      if (typeof arg3 === 'boolean') {
        initial = arg3 === true;
      } else if (typeof arg3 === 'function') {
        actionToUse = arg3;
      }
      if (typeof arg4 === 'boolean') {
        initial = arg4 === true;
      }
      state = createState(stateOrName, allowedFrom, actionToUse);
    } else {
      initial = arg2 === true;
    }
    if (this.states.some(x => x.name === state.name)) throw new Error(`State '${state.name}' is already registered`);
    this.states.push(state);
    if (initial) {
      if (!!this.initialState)
        throw new Error(`State '${this.initialState}' is already registered as the initial state`);
      this.initialState = state.name;
    }
  }

  canGotoState(toState: string) {
    if (!this.currentState) return true;
    const filtered = this.states.filter(x => x.name === toState);
    const currentState: State = this.currentState as any;
    return filtered.length > 0 && filtered[0].allowedFrom.some(x => x === currentState.name);
  }

  async gotoState(toState: string) {
    if (!this.canGotoState(toState)) return false;
    const nextState = this.states.filter(x => x.name === toState)[0];
    this.currentState = nextState;
    const action: () => string = this.currentState.action as any;
    if (!!action) {
      const nextState = action();
      const currentState: State = this.currentState as any;
      if (!!nextState && nextState !== currentState.name) await this.gotoState(nextState);
    }
    return true;
  }

  async start() {
    if (!!this.initialState) {
      await this.gotoState(this.initialState);
    }
  }
}
