import { cloneState, createState } from './state';

describe('cloneState', () => {
  it('should return null if null passed in', () => {
    const result = cloneState(null as any);
    expect(result).toBeNull();
  });

  it('should return null if undefined passed in', () => {
    const result = cloneState(undefined as any);
    expect(result).toBeNull();
  });

  it(`should use 'any' for allowedFrom if original object's is null`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: null as any,
    });
    expect(result.allowedFrom).toStrictEqual('any');
  });

  it(`should use 'any' for allowedFrom if original object's is undefined`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: undefined as any,
    });
    expect(result.allowedFrom).toStrictEqual('any');
  });

  it('should use a shallow copy of the allowedFrom array', () => {
    const allowedFrom = ['test1', 'test2', 'test3'];
    const result = cloneState({
      name: 'test',
      allowedFrom,
    });
    (result.allowedFrom as any).push('test4');
    expect(result.allowedFrom.length).toStrictEqual(4);
    expect(allowedFrom.length).toStrictEqual(3);
  });
});

describe('createState', () => {
  it('should use promise.resolve(true) when no canTrigger is passed in', async () => {
    const state = createState('test');
    const result = await (state as any).canTrigger(undefined as any);
    expect(result).toBeTrue();
  });
});
