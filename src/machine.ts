import { createState, cloneState, State } from './state';

export class StateMachine {
  constructor(public name: string) {}

  get currentState() {
    return this.currentStateObj?.name;
  }
  private readonly states: State[] = [];
  private currentStateObj: State | null = null;
  private initialState: string | undefined;

  registerState(state: State, setAsInitial?: boolean);
  registerState(name: string, setAsInitial?: boolean);
  registerState(name: string, allowedFrom?: string[] | 'any', setAsInitial?: boolean);
  registerState(
    name: string,
    action?: (currentState: string, ...args: any[]) => Promise<string>,
    setAsInitial?: boolean
  );
  registerState(
    name: string,
    allowedFrom?: string[] | 'any',
    action?: (currentState: string, ...args: any[]) => Promise<string>,
    setAsInitial?: boolean
  );
  registerState(stateOrName: State | string, arg2?: any, arg3?: any, arg4?: boolean) {
    let state: State = stateOrName as any;
    let initial = false;
    if (typeof stateOrName === 'string') {
      let actionToUse: (currentState: string, ...args: any[]) => Promise<string> = undefined as any;
      let allowedFrom: any = 'any';
      const arg2Type = typeof arg2;
      const arg3Type = typeof arg3;
      if (arg2Type === 'boolean') {
        initial = arg2 === true;
      } else if (arg2Type === 'function') {
        actionToUse = arg2;
      } else if (arg2Type === 'object' || arg2Type === 'string') {
        allowedFrom = arg2;
      }
      if (arg3Type === 'boolean') {
        initial = arg3 === true;
      } else if (arg3Type === 'function') {
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

  canTrigger(stateName: string) {
    const newState = this.getState(stateName);
    const newStateExists = !!newState;
    const currentState = this.currentState;
    return (
      newStateExists &&
      (!currentState || newState.allowedFrom === 'any' || newState.allowedFrom.some(x => x === currentState))
    );
  }

  async trigger(stateName: string, ...args: any[]) {
    if (!this.canTrigger(stateName)) return false;
    const stateObj = this.getState(stateName);
    const currentState: any = this.currentState;
    this.currentStateObj = stateObj;
    const action: (x: string, ...args: any[]) => Promise<string> = stateObj.action as any;
    if (!!action) {
      const nextStateName = await action(currentState, ...args);
      if (!!nextStateName && nextStateName !== stateObj.name) {
        const success = await this.trigger(nextStateName);
        if (!success)
          throw new Error(`Cannot transition to state '${nextStateName}' from current state of '${currentState}'`);
      }
    }
    return true;
  }

  async start() {
    if (!!this.initialState) {
      await this.trigger(this.initialState);
    }
  }

  getStates(): State[] {
    return this.states.map(cloneState);
  }

  private getState(stateName: string): State {
    const states = [...this.states];
    const filtered = states.filter(x => x.name === stateName);
    return filtered.length > 0 ? filtered[0] : (null as any);
  }
}
