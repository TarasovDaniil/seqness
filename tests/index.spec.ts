import 'mocha';
import { assert } from 'chai';

import { chain, chainFromData } from '../src';

describe('Hello World Function', () => {
  it('should be a function', () => {
    assert.isFunction(chain);
  });
});

describe('Goodbye Function', () => {
  it('should be a function', () => {
    assert.isFunction(chainFromData);
  });
});
