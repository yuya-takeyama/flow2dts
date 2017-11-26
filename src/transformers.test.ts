import 'mocha';
import * as assert from 'power-assert';
import { transformParameters } from './transformers';

describe('transformers', () => {
  describe('transformParameters', () => {
    it('converts correctly', () => {
      assert.deepEqual(transformParameters([]), '');
    });
  });
});
