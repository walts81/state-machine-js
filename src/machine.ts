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
  registerState(name: string, allowedFrom?: string[], setAsInitial?: boolean);
  registerState(name: string, action?: () => Promise<string>, setAsInitial?: boolean);
  registerState(name: string, allowedFrom?: string[], action?: () => Promise<string>, setAsInitial?: boolean);
  registerState(stateOrName: State | string, arg2?: any, arg3?: any, arg4?: boolean) {
    let state: State = stateOrName as any;
    let initial = false;
    if (typeof stateOrName === 'string') {
      let actionToUse: () => Promise<string> = undefined as any;
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

  canTrigger(stateName: string) {
    const newState = this.getState(stateName);
    return !!newState && (!this.currentState || newState.allowedFrom.some(x => x === this.currentState));
  }

  async trigger(stateName: string) {
    if (!this.canTrigger(stateName)) return false;
    const currentState = this.getState(stateName);
    this.currentStateObj = currentState;
    const action: () => Promise<string> = currentState.action as any;
    if (!!action) {
      const nextStateName = await action();
      if (!!nextStateName && nextStateName !== currentState.name) await this.trigger(nextStateName);
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
    const states = this.getStates();
    const filtered = states.filter(x => x.name === stateName);
    return filtered.length > 0 ? filtered[0] : (null as any);
  }
}
