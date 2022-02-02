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

  it(`should use empty array for allowedFrom if original object's is null`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: null as any,
    });
    expect(result.allowedFrom).to.eql([]);
  });

  it(`should use empty array for allowedFrom if original object's is undefined`, () => {
    const result = cloneState({
      name: 'test',
      allowedFrom: undefined as any,
    });
    expect(result.allowedFrom).to.eql([]);
  });
});
