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
      {
        input:  'export default function foo(bar: string): void {}\n',
        output: 'export default function foo(bar: string): void;\n',
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

      // export named function with type parameter
      {
        input:  'export function foo<T>(bar: T): T {}\n',
        output: 'export function foo<T>(bar: T): T;\n',
      },
      {
        input:  'export function foo<T, U>(bar: T): U {}\n',
        output: 'export function foo<T, U>(bar: T): U;\n',
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
