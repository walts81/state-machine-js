export interface StateActionContext {
  machine: IStateMachine;
  previousState: string;
}

export interface StateActionCanTriggerContext {
  machine: IStateMachine;
}

export interface StateAction<T = any> {
  (context: StateActionContext, ...args: any[]): Promise<StateActionResult<T>>;
}

export interface StateActionResult<T = any> {
  nextState: string;
  data?: T;
}

export interface StateActionCanTrigger {
  (context: StateActionCanTriggerContext, ...args: any[]): Promise<boolean>;
}

export type AllowedFrom = string[] | 'any';

export interface State<T = any> {
  name: string;
  allowedFrom: string[] | 'any';
  action?: StateAction<T>;
  canTrigger?: StateActionCanTrigger;
}

export interface IStateMachine<T = any> {
  name: string;
  currentState: string;
  currentStateObject: State | null;
  data: T;

  registerState(state: State<T>, setAsInitial?: boolean): void;
  registerState(stateName: string, setAsInitial?: boolean): void;
  registerState(stateName: string, allowedFrom?: AllowedFrom, setAsInitial?: boolean): void;

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

  canTrigger(state: string, ...args: any[]): Promise<boolean>;
  trigger(state: string, ...args: any[]): Promise<boolean>;
  start(): Promise<void>;
  getStates(): State[];
}
