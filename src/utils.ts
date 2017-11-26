export const neverReachHere = (msg: string): never => {
  throw new Error(`Never reach here: ${msg}`);
};
