export interface State {
  name: string;
  allowedFrom: string[] | 'any';
  action?: (machine: IStateMachine, ...args: any[]) => Promise<string>;
}

export interface IStateMachine {
  name: string;
  currentState: string;
  canTrigger(state: string): boolean;
  trigger(state: string, ...args: any[]): Promise<boolean>;
  start(): Promise<void>;
  getStates(): State[];
}
