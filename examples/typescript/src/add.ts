export function add(a: number, b: number): number {
  return a + b;
}

export function sub(a: number, b: number): number {
  return a - b; // intentionally has no code coverage: `npm run cover` to test
}
