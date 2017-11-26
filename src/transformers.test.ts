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
      {
        input:  'export default function foo(bar: ?string): void {}\n',
        output: 'export default function foo(bar?: string): void;\n',
      },
      {
        input:  'export default function foo(bar: mixed): mixed {}\n',
        output: 'export default function foo(bar: any): any;\n',
      },
      {
        input:  'export default function foo(bar: any): any {}\n',
        output: 'export default function foo(bar: any): any;\n',
      },
      {
        input:  'export default function foo(bar: Function): Function {}\n',
        output: 'export default function foo(bar: Function): Function;\n',
      },
      {
        input:  'export default function (): string { return \'foo\'; }\n',
        output: 'export default function (): string;\n',
      },
      {
        input:  'export default function (config: Config = {}): string { return \'foo\'; }\n',
        output: 'export default function (config: Config): string;\n',
      },

      // export named function
      {
        input:  'export function foo(bar: string): number {}\n',
        output: 'export function foo(bar: string): number;\n',
      },

      // export multiple named functions
      {
        input:  'export function foo(bar: string): number {}\n\nexport function foo2(bar2: number): string {}\n',
        output: 'export function foo(bar: string): number;\n\nexport function foo2(bar2: number): string;\n',
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

      // import declaration
      {
        input:  'import { Foo } from \'bar\';\n',
        output: '',
      },
      {
        input:  'import type { Foo } from \'bar\';\n',
        output: 'import { Foo } from \'bar\';\n',
      },
      {
        input:  'import type { Foo, Baz, Qux } from \'bar\';\n',
        output: 'import { Foo, Baz, Qux } from \'bar\';\n',
      },
      {
        input:  'import type { Foo as foo, Baz as baz, Qux as qux } from \'bar\';\n',
        output: 'import { Foo as foo, Baz as baz, Qux as qux } from \'bar\';\n',
      },

      // export type alias
      {
        input:  'export type Foo = {\n' +
                '  bar: number,\n' +
                '  baz: string,\n' +
                '}\n',
        output: 'export interface Foo {\n' +
                '  bar: number;\n' +
                '  baz: string;\n' +
                '}\n',
      },
      {
        input:  'export type Foo<A, B, C> = {\n' +
                '  bar: A,\n' +
                '  baz: B,\n' +
                '  qux: C,\n' +
                '}\n',
        output: 'export interface Foo<A, B, C> {\n' +
                '  bar: A;\n' +
                '  baz: B;\n' +
                '  qux: C;\n' +
                '}\n',
      },
      {
        input:  'export type NumberAlias = number;\n',
        output: 'export type NumberAlias = number;\n',
      },
      {
        input:  'export type Alias = Type;\n',
        output: 'export type Alias = Type;\n',
      },
      {
        input:  'export type State = {\n' +
                '  foo: boolean;\n' +
                '} | void;\n',
        output: 'export type State = {\n' +
                '  foo: boolean;\n' +
                '} | void;\n',
      },
      {
        input:  'export type State = \'SUCCESS\';\n',
        output: 'export type State = \'SUCCESS\';\n',
      },

      // non-exported type alias
      {
        input:  'type Alias = Type;\n',
        output: 'type Alias = Type;\n',
      },
      {
        input:  'type State = true | false | \'unknown\';\n',
        output: 'type State = true | false | \'unknown\';\n',
      },
      {
        input:  'type Callback = (Error, Response) => any;\n',
        output: 'type Callback = (Error, Response) => any;\n',
      },
      {
        input:  'type Order = {\n' +
                '  state: Ok | Ng | Unknown,\n' +
                '}\n',
        output: 'interface Order {\n' +
                '  state: Ok | Ng | Unknown;\n' +
                '}\n',
      },
      {
        input:  'type Numbers = Array<number>;\n',
        output: 'type Numbers = Array<number>;\n',
      },

      // skipped declaration
      {
        input:  'const foo = 1;\n',
        output: '',
      },
      {
        input:  'function foo() {}\n',
        output: '',
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
