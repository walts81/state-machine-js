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
