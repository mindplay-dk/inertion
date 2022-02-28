import isEqual from "fast-deep-equal";
import { Fact } from "./api";

export function ok(actual: unknown, ...details: unknown[]): Fact {
  return {
    label: "ok",
    pass: actual === true,
    actual,
    expected: true,
    details,
  };
}

// TODO IOC for `isEqual`: must support at least all of the following:
//      https://www.npmjs.com/package/fast-deep-equal    *DEFAULT*
//      https://www.npmjs.com/package/deep-equal
//      https://www.npmjs.com/package/deep-is

export function equal<T>(actual: T, expected: T, ...details: unknown[]): Fact {
  return {
    label: "equal",
    pass: isEqual(actual, expected),
    actual,
    expected,
    details,
  };
}

export default {
  ok,
  equal,
};

// TODO check compatibility of `assertion` with the following:
//      https://www.npmjs.com/package/validator
//      https://www.npmjs.com/package/check-types
//      https://www.npmjs.com/package/chai
//      https://www.npmjs.com/package/is
//      https://www.npmjs.com/package/typed-assert

/**
 * Generates a test-method from a simple assertion function.
 * 
 * This factory function assumes an input function where the first
 * argument is the actual value. Any additional parameters will be
 * reported as `details` in the generated `Fact` - the resulting
 * function will not have an `expected` value, and therefore will
 * be unable to display as a diff in reporters.
 * 
 * Works with predicate libraries such as `validator` or `is`.
 * 
 * @see https://www.npmjs.com/package/validator
 */
export function assertion<F extends (...args: any[]) => boolean>(label: string, assert: F) {
  return (...args: [...params: Parameters<F>, ...details: unknown[]]): Fact => ({
    label,
    pass: assert(...args.slice(0, assert.length)),
    actual: args[0],
    expected: undefined,
    details: args.slice(1),
  });
}
