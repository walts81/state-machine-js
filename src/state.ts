import { State, StateAction, StateActionCanTrigger, AllowedFrom } from './interfaces';

export const createState = <T = any>(
  name: string,
  allowedFrom?: AllowedFrom,
  action?: StateAction,
  canTrigger?: StateActionCanTrigger
): State<T> => {
  return {
    name,
    allowedFrom: allowedFrom || 'any',
    action: action || (() => Promise.resolve({ nextState: name })),
    canTrigger: canTrigger || (() => Promise.resolve(true)),
  };
};

export const cloneState = <T = any>(state: State<T>): State<T> => {
  if (!state) return null as any;
  const allowedFromIsArr = !!state.allowedFrom && typeof state.allowedFrom === 'object';
  return {
    name: state.name,
    allowedFrom: allowedFromIsArr ? [...state.allowedFrom] : state.allowedFrom || 'any',
    action: state.action,
    canTrigger: state.canTrigger,
  };
};
