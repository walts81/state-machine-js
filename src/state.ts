export interface State {
  name: string;
  allowedFrom: string[];
  action?: () => string;
}

export const createState = (name: string, allowedFrom?: string[], action?: () => string) => {
  return {
    name,
    allowedFrom: allowedFrom || [],
    action: action || (() => name),
  };
};

export const cloneState = (state: State): State => {
  if (!state) return null as any;
  return {
    name: state.name,
    allowedFrom: !!state.allowedFrom ? [...state.allowedFrom] : [],
    action: state.action,
  };
};
