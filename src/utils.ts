import { TFlowLoc } from 'flow-parser';

export function neverReachHere(msg: string): never {
  throw new Error(`Never reach here: ${msg}`);
}

export function position(loc: TFlowLoc): string {
  return `(${loc.start.line}:${loc.start.column})`;
}

export function indent(level: number, code: string): string {
  console.log(level)
  return code
    .split('\n')
    .map(line => line === '' ? '' : ' '.repeat(level) + line)
    .join('\n');
}