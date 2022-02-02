export interface State {
  name: string;
  allowedFrom: string[];
  action?: () => Promise<string>;
}

export const createState = (name: string, allowedFrom?: string[], action?: () => Promise<string>) => {
  return {
    name,
    allowedFrom: allowedFrom || [],
    action: action || (() => Promise.resolve(name)),
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
