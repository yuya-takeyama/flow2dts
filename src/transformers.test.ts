import 'mocha';
import * as assert from 'power-assert';
import { transform, transformParameters } from './transformers';

describe('transformers', () => {
  describe('transform', () => {
    const examples = [
      // export default
      {
        input:  "export default function foo(bar: string): string {}",
        output: "export default function foo(bar: string): string {}",
      },
      {
        input:  "export default function foo(bar: string): number {}",
        output: "export default function foo(bar: string): number {}",
      },
      {
        input:  "export default function foo(bar: string): boolean {}",
        output: "export default function foo(bar: string): boolean {}",
      },
      {
        input:  "export default function foo(bar: string): Baz {}",
        output: "export default function foo(bar: string): Baz {}",
      },

      // export named function
      {
        input:  "export function foo(bar: string): number {}",
        output: "export function foo(bar: string): number {}",
      },
    ];

    it('transform correctly', () => {
      for (const example of examples) {
        assert.equal(transform(example.input), example.output);
      }
    });
  });

  describe('transformParameters', () => {
    it('transform correctly', () => {
      assert.deepEqual(transformParameters([]), '');
    });
  });
});
