import { Assertion, Result } from "./api";

// TODO IOC for `isEqual`: must support at least all of the following:
//      https://www.npmjs.com/package/fast-deep-equal    *DEFAULT*
//      https://www.npmjs.com/package/deep-equal
//      https://www.npmjs.com/package/deep-is

import isEqual from "fast-deep-equal";

/**
 * Factory function for assertion test-methods.
 * 
 * TODO generic return-type? these are compatible with `TestMethod`, but we can't type-hint them as such without losing the parameter list.
 */
export function createAssertion<F extends Assertion>(assertion: F) {
  return (...args: Parameters<F>) => ({
    type: "Asserted" as const,
    result: assertion(...(args as any[])) // TODO avoid this type-cast somehow? not sure why TS complains here without it
  });
}

export const ok = createAssertion((actual: any, ...details: any[]): Result => ({
  pass: !!ok,
  actual,
  expected: true,
  details,
}));

export const equal = createAssertion((actual: any, expected: any, details: any[]): Result => ({
  pass: isEqual(actual, expected),
  actual,
  expected,
  details,
}));

// TODO factory functions to generate `Assertion` functions - must support the following:
//      https://www.npmjs.com/package/validator
//      https://www.npmjs.com/package/check-types
//      https://www.npmjs.com/package/chai
//      https://www.npmjs.com/package/is
//      https://www.npmjs.com/package/typed-assert
