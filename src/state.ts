export interface State {
  name: string;
  allowedFrom: string[] | 'any';
  action?: (currentState: string) => Promise<string>;
}

export const createState = (
  name: string,
  allowedFrom?: string[] | 'any',
  action?: (currentState: string) => Promise<string>
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
