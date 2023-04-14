import { State, StateAction, StateActionCanTrigger, AllowedFrom } from './interfaces';

export const createState = <MachineData = any, StateData = any>(
  name: string,
  allowedFrom?: AllowedFrom,
  action?: StateAction<MachineData, StateData>,
  canTrigger?: StateActionCanTrigger<MachineData>
): State<MachineData, StateData> => {
  const state = {
    name,
    allowedFrom: allowedFrom || 'any',
    canTrigger: canTrigger || (() => Promise.resolve(true)),
  } as any;
  state.action = action || (() => Promise.resolve({ nextStateObject: state, nextStateName: '' }));
  state.hasDefaultAction = !action;
  return state;
};

export const cloneState = <MachineData = any, StateData = any>(
  state: State<MachineData, StateData>
): State<MachineData, StateData> => {
  if (!state) return null as any;
  const allowedFromIsArr = !!state.allowedFrom && Array.isArray(state.allowedFrom);
  const clone = {
    name: state.name,
    allowedFrom: allowedFromIsArr ? [...state.allowedFrom] : state.allowedFrom || 'any',
    canTrigger: state.canTrigger,
    hasDefaultAction: (state as any).hasDefaultAction,
  } as any;
  clone.action = (state as any).hasDefaultAction
    ? () => Promise.resolve({ nextStateObject: clone, nextStateName: clone.name })
    : state.action;
  return clone;
};
