import { expect } from 'chai';
import 'mocha';
import { cloneState } from './state';

describe('cloneState', () => {
  it('should return null if null passed in', () => {
    const result = cloneState(null as any);
    expect(result).to.be.null;
  });

  it('should return null if undefined passed in', () => {
    const result = cloneState(undefined as any);
    expect(result).to.be.null;
  });

  it(`should use 'any' for allowedFrom if original object's is null`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: null as any,
    });
    expect(result.allowedFrom).to.eq('any');
  });

  it(`should use 'any' for allowedFrom if original object's is undefined`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: undefined as any,
    });
    expect(result.allowedFrom).to.eq('any');
  });

  it('should use a shallow copy of the allowedFrom array', () => {
    const allowedFrom = ['test1', 'test2', 'test3'];
    const result = cloneState({
      name: 'test',
      allowedFrom,
    });
    (result.allowedFrom as any).push('test4');
    expect(result.allowedFrom.length).to.eq(4);
    expect(allowedFrom.length).to.eq(3);
  });
});
