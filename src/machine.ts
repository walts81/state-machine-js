import { createState, cloneState } from './state';
import { AllowedFrom, State, StateAction, StateActionCanTrigger, IStateMachine } from './interfaces';

let currentActionNumber = 0;

export class StateMachine<MachineData = any> implements IStateMachine<MachineData> {
  constructor(public name: string, data?: MachineData) {
    const dataToUse = data || ({} as any);
    this.data = dataToUse;
  }

  get currentStateName() {
    return this.currentStateObj?.name || '';
  }
  data: MachineData;

  private readonly states: State<MachineData>[] = [];
  private currentStateObj: State<MachineData> | null = null;
  private initialState: string | undefined;
  private actionQueue: number[] = [];

  registerState<StateData = any>(
    state: State<MachineData, StateData>,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(stateName: string, setAsInitial?: boolean): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateName: string,
    allowedFrom: AllowedFrom,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateName: string,
    action: StateAction<MachineData, StateData>,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<MachineData, StateData>,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateName: string,
    action: StateAction<MachineData, StateData>,
    canTrigger: StateActionCanTrigger<MachineData>,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<MachineData, StateData>,
    canTrigger: StateActionCanTrigger<MachineData>,
    setAsInitial?: boolean
  ): State<MachineData, StateData>;
  registerState<StateData = any>(
    stateOrName: State<MachineData, StateData> | string,
    arg2?: boolean | AllowedFrom | StateAction<MachineData, StateData> | undefined,
    arg3?: boolean | StateAction<MachineData, StateData> | StateActionCanTrigger<MachineData> | undefined,
    arg4?: boolean | StateActionCanTrigger<MachineData> | undefined,
    arg5?: boolean | undefined
  ): State<MachineData, StateData> {
    let state = stateOrName as State<MachineData, StateData>;
    const setAsInitial = arg2 === true || arg3 === true || arg4 === true || arg5 === true;
    if (typeof stateOrName === 'string') {
      const allowedFrom =
        arg2 === undefined || arg2 === true || arg2 === false || typeof arg2 === 'function' ? 'any' : (arg2 as any);
      const action: StateAction<MachineData, StateData> | undefined = (
        !!arg2 && typeof arg2 === 'function' ? arg2 : !!arg3 && typeof arg3 === 'function' ? arg3 : undefined
      ) as any;
      const canTrigger: StateActionCanTrigger<MachineData> | undefined = (
        !!arg2 && typeof arg2 === 'function' && !!arg3 && typeof arg3 === 'function'
          ? arg3
          : !!arg4 && typeof arg4 === 'function'
          ? arg4
          : undefined
      ) as any;
      state = createState<MachineData, StateData>(stateOrName, allowedFrom, action, canTrigger);
    }
    this.addState(state, setAsInitial);
    return state;
  }

  async canTrigger(stateName: string, ...args: any[]) {
    const newState = this.getInternalState(stateName);
    const newStateExists = !!newState;
    if (!newStateExists) return false;

    const ctx = this.getActionContext();
    const canTriggerAction = newState.canTrigger;
    if (!!canTriggerAction) {
      const ok = await canTriggerAction(ctx, ...args);
      if (!ok) return false;
    }
    if (newState.allowedFrom === 'any') return true;
    if (newState.allowedFrom === 'none') return !this.currentStateObj;
    const currentStateName = this.currentStateName;
    return !this.currentStateObj || newState.allowedFrom.some(x => x === currentStateName);
  }

  async trigger(stateName: string, ...args: any[]) {
    const ok = await this.canTrigger(stateName, ...args);
    if (!ok) return false;

    const stateObj = this.getInternalState(stateName);
    this.setCurrentState(stateObj);
    const action = stateObj?.action;

    let success = true;
    let attemptedNextState = '';

    const actionNum = currentActionNumber++;
    this.actionQueue.unshift(actionNum);
    let ix = 0;
    if (!!action) {
      const ctx = this.getActionContext();
      const result = await action(ctx, ...args);
      ix = this.actionQueue.indexOf(actionNum);
      if (ix === 0) {
        // only try triggering the next state if the state wasn't manually changed out from underneath us
        if (!!result.nextStateName && result.nextStateName !== stateObj.name) {
          attemptedNextState = result.nextStateName;
          success = await this.trigger(result.nextStateName, result.data);
        }
      }
    }
    this.actionQueue.splice(ix, 1);

    if (!success)
      throw new Error(`Cannot transition to state '${attemptedNextState}' from current state of '${stateName}'`);
    return true;
  }

  async start() {
    if (!!this.initialState) {
      await this.trigger(this.initialState);
    }
  }

  getStates(): State<MachineData>[] {
    return this.states.map(cloneState);
  }

  getState<StateData = any>(stateName: string): State<MachineData, StateData> | null {
    const state = this.getInternalState<StateData>(stateName);
    return !!state ? cloneState(state) : null;
  }

  private setCurrentState(state: State | null) {
    this.currentStateObj = state;
  }

  private getActionContext() {
    const previousStateName = this.currentStateName;

    return { machine: this, previousStateName };
  }

  private addState<StateData = any>(state: State<MachineData, StateData>, setAsInitial: boolean) {
    if (this.states.some(x => x.name === state.name)) throw new Error(`State '${state.name}' is already registered`);
    this.states.push(state);
    if (setAsInitial) {
      if (!!this.initialState)
        throw new Error(`State '${this.initialState}' is already registered as the initial state`);
      this.initialState = state.name;
    }
  }

  private getInternalState<StateData = any>(stateName: string): State<MachineData, StateData> | null {
    const states = [...this.states];
    const filtered = states.filter(x => x.name === stateName);
    const result = filtered.length > 0 ? filtered[0] : null;
    return result;
  }
}
