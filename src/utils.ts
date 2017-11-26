import { TFlowLoc } from 'flow-parser';

export function neverReachHere(msg: string): never {
  throw new Error(`Never reach here: ${msg}`);
}

export function position(loc: TFlowLoc): string {
  return `(${loc.start.line}:${loc.start.column})`;
}
