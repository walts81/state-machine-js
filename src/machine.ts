import { createState, cloneState } from './state';
import { AllowedFrom, State, StateAction, StateActionCanTrigger, IStateMachine } from './interfaces';

export class StateMachine<T = any> implements IStateMachine<T> {
  constructor(public name: string, data?: T) {
    const dataToUse = data || ({} as any);
    this.mapData(dataToUse);
  }

  get currentState() {
    return this.currentStateObj?.name || '';
  }
  get currentStateObject() {
    return !!this.currentStateObj ? cloneState(this.currentStateObj) : null;
  }
  get data() {
    return this.machineData;
  }
  private readonly states: State[] = [];
  private currentStateObj: State | null = null;
  private initialState: string | undefined;
  private machineData: T;

  registerState(state: State<T>, setAsInitial?: boolean): void;
  registerState(stateName: string, setAsInitial?: boolean): void;
  registerState(stateName: string, allowedFrom?: AllowedFrom, setAsInitial?: boolean): void;
  registerState<T extends object = any>(
    stateOrName: State<T> | string,
    arg2?: AllowedFrom | boolean,
    arg3?: boolean
  ): void {
    let state = stateOrName as State<T>;
    let setAsInitial = arg2 === true;
    if (typeof stateOrName === 'string') {
      const allowedFrom: any = Array.isArray(arg2) || arg2 === 'any' ? arg2 : undefined;
      state = createState<T>(stateOrName, allowedFrom);
      if (typeof arg3 === 'boolean') setAsInitial = arg3 === true;
    }
    this.registerStateInternal(state, setAsInitial);
  }

  registerStateWithAction(stateName: string, action: StateAction<T>, setAsInitial?: boolean): void;
  registerStateWithAction(
    stateName: string,
    action: StateAction<T>,
    canTrigger: StateActionCanTrigger,
    setAsInitial?: boolean
  ): void;
  registerStateWithAction(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<T>,
    setAsInitial?: boolean
  ): void;
  registerStateWithAction(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<T>,
    canTrigger: StateActionCanTrigger,
    setAsInitial?: boolean
  ): void;
  registerStateWithAction(
    stateName: string,
    arg2: AllowedFrom | StateAction<T>,
    arg3?: StateAction<T> | StateActionCanTrigger | boolean,
    arg4?: StateActionCanTrigger | boolean,
    arg5?: boolean
  ): void {
    const allowedFrom: any = typeof arg2 === 'function' ? undefined : arg2;
    const action: any = typeof arg2 === 'function' ? arg2 : arg3;
    const canTrigger: any =
      typeof arg2 === 'function' && typeof arg3 === 'function' ? arg3 : typeof arg4 === 'function' ? arg4 : undefined;
    const state = createState(stateName, allowedFrom, action, canTrigger);
    let setAsInitial = arg3 === true;
    if (typeof arg4 === 'boolean') setAsInitial = arg4 === true;
    else if (typeof arg5 === 'boolean') setAsInitial = arg5 === true;
    this.registerStateInternal(state, setAsInitial);
  }

  async canTrigger(stateName: string, ...args: any[]) {
    const newState = this.getState(stateName);
    const newStateExists = !!newState;
    if (!newStateExists) return false;

    const currentState = this.currentState;
    const canTriggerAction = newState.canTrigger;
    let ok = true;
    if (!!canTriggerAction) {
      ok = await canTriggerAction({ machine: this }, ...args);
    }
    return (
      ok && (!currentState || newState.allowedFrom === 'any' || newState.allowedFrom.some(x => x === currentState))
    );
  }

  async trigger(stateName: string, ...args: any[]) {
    const ok = await this.canTrigger(stateName, ...args);
    if (!ok) return false;

    const stateObj = this.getState(stateName);
    const previousState: any = this.currentState;
    this.currentStateObj = stateObj;
    const action: StateAction = stateObj.action as any;
    if (!!action) {
      const result = await action({ machine: this, previousState }, ...args);
      if (!!result.data) {
        this.mapData(result.data);
      }
      if (!!result.nextState && result.nextState !== stateObj.name) {
        const success = await this.trigger(result.nextState);
        if (!success)
          throw new Error(`Cannot transition to state '${result.nextState}' from current state of '${previousState}'`);
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

  private mapData(data: any) {
    this.machineData = JSON.parse(JSON.stringify(data));
  }

  private registerStateInternal(state: State, setAsInitial: boolean) {
    if (this.states.some(x => x.name === state.name)) throw new Error(`State '${state.name}' is already registered`);
    this.states.push(state);
    if (setAsInitial) {
      if (!!this.initialState)
        throw new Error(`State '${this.initialState}' is already registered as the initial state`);
      this.initialState = state.name;
    }
  }

  private getState(stateName: string): State {
    const states = [...this.states];
    const filtered = states.filter(x => x.name === stateName);
    return filtered.length > 0 ? filtered[0] : (null as any);
  }
}
