export interface StateActionContext<T = any> {
  machine: IStateMachine<T>;
  previousState: string;
}

export interface StateActionCanTriggerContext<T = any> {
  machine: IStateMachine<T>;
}

export interface StateAction<T = any> {
  (context: StateActionContext<T>, ...args: any[]): Promise<StateActionResult<T>>;
}

export interface StateActionResult<T = any> {
  nextState: string;
  data?: T;
}

export interface StateActionCanTrigger<T = any> {
  (context: StateActionCanTriggerContext<T>, ...args: any[]): Promise<boolean>;
}

export type AllowedFrom = string[] | 'none' | 'any';

export interface State<T = any> {
  name: string;
  allowedFrom: string[] | 'none' | 'any';
  action?: StateAction<T>;
  canTrigger?: StateActionCanTrigger<T>;
}

export interface IStateMachine<T = any> {
  name: string;
  currentState: string;
  currentStateObject: State<T> | null;
  data: T;

  registerState(state: State<T>, setAsInitial?: boolean): void;
  registerState(stateName: string, setAsInitial?: boolean): void;
  registerState(stateName: string, allowedFrom?: AllowedFrom, setAsInitial?: boolean): void;

  registerStateWithAction(stateName: string, action: StateAction<T>, setAsInitial?: boolean): void;
  registerStateWithAction(
    stateName: string,
    action: StateAction<T>,
    canTrigger: StateActionCanTrigger<T>,
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
    canTrigger: StateActionCanTrigger<T>,
    setAsInitial?: boolean
  ): void;

  canTrigger(state: string, ...args: any[]): Promise<boolean>;
  trigger(state: string, ...args: any[]): Promise<boolean>;
  start(): Promise<void>;
  getStates(): State<T>[];
}
