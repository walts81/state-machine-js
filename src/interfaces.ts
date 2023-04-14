export interface StateActionContext<MachineData = any> {
  machine: IStateMachine<MachineData>;
  previousStateName: string;
  previousState: State<MachineData> | null;
}

export interface StateActionResult<StateData = any> {
  nextStateName: string;
  data?: StateData;
}

export type StateAction<MachineData = any, StateData = any> = (
  context: StateActionContext<MachineData>,
  ...args: any[]
) => Promise<StateActionResult<StateData>>;

export type StateActionCanTrigger<MachineData = any> = (
  context: StateActionContext<MachineData>,
  ...args: any[]
) => Promise<boolean>;

export type AllowedFrom = string[] | 'none' | 'any';

export interface State<MachineData = any, StateData = any> {
  name: string;
  allowedFrom: string[] | 'none' | 'any';
  action?: StateAction<MachineData, StateData>;
  canTrigger?: StateActionCanTrigger<MachineData>;
}

export interface IStateMachine<MachineData = any> {
  name: string;
  currentStateName: string;
  currentState: State<MachineData> | null;
  data: MachineData;

  registerState<StateData = any>(state: State<MachineData, StateData>, setAsInitial?: boolean): void;
  registerState<StateData = any>(stateName: string, setAsInitial?: boolean): void;
  registerState<StateData = any>(stateName: string, allowedFrom?: AllowedFrom, setAsInitial?: boolean): void;
  registerState<StateData = any>(
    stateName: string,
    action: StateAction<MachineData, StateData>,
    setAsInitial?: boolean
  ): void;
  registerState<StateData = any>(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<MachineData, StateData>,
    setAsInitial?: boolean
  ): void;
  registerState<StateData = any>(
    stateName: string,
    action: StateAction<MachineData, StateData>,
    canTrigger: StateActionCanTrigger<MachineData>,
    setAsInitial?: boolean
  ): void;
  registerState<StateData = any>(
    stateName: string,
    allowedFrom: AllowedFrom,
    action: StateAction<MachineData, StateData>,
    canTrigger: StateActionCanTrigger<MachineData>,
    setAsInitial?: boolean
  ): void;

  canTrigger(state: string, ...args: any[]): Promise<boolean>;
  trigger(state: string, ...args: any[]): Promise<boolean>;
  start(): Promise<void>;
  getStates(): State<MachineData>[];
}
