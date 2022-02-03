import { State, IStateMachine } from './interfaces';

export const createState = (
  name: string,
  allowedFrom?: string[] | 'any',
  action?: (machine: IStateMachine, ...args: any[]) => Promise<string>
) => {
  return {
    name,
    allowedFrom: allowedFrom || 'any',
    action: action || (() => Promise.resolve(name)),
  };
};

export const cloneState = (state: State): State => {
  if (!state) return null as any;
  const allowedFromIsArr = !!state.allowedFrom && typeof state.allowedFrom === 'object';
  return {
    name: state.name,
    allowedFrom: allowedFromIsArr ? [...state.allowedFrom] : ('any' as any),
    action: state.action,
  };
};
