import 'mocha';
import * as assert from 'power-assert';
import { transform, transformParameters } from './transformers';

describe('transformers', () => {
  describe('transform', () => {
    const examples = [
      // export default
      {
        input:  'export default function foo(bar: string): string { reeturn \'FOO!\'; }\n',
        output: 'export default function foo(bar: string): string;\n',
      },
      {
        input:  'export default function foo(bar: string): string {}\n',
        output: 'export default function foo(bar: string): string;\n',
      },
      {
        input:  'export default function foo(bar: string): number {}\n',
        output: 'export default function foo(bar: string): number;\n',
      },
      {
        input:  'export default function foo(bar: string): boolean {}\n',
        output: 'export default function foo(bar: string): boolean;\n',
      },
      {
        input:  'export default function foo(bar: string): Baz {}\n',
        output: 'export default function foo(bar: string): Baz;\n',
      },

      // export named function
      {
        input:  'export function foo(bar: string): number {}\n',
        output: 'export function foo(bar: string): number;\n',
      },

      // export multiple named functions
      {
        input:  'export function foo(bar: string): number {}\nexport function foo2(bar2: number): string {}\n',
        output: 'export function foo(bar: string): number;\nexport function foo2(bar2: number): string;\n',
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
