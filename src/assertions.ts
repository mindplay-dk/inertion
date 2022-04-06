import isEqual from "fast-deep-equal";
import { Fact } from "./api";

export function ok(actual: boolean, ...details: unknown[]): Fact {
  return {
    label: "ok",
    pass: actual === true,
    actual,
    expected: true,
    details,
  };
}

export function notOk(actual: boolean, ...details: unknown[]): Fact {
  return {
    label: "notOk",
    pass: actual === false,
    actual,
    expected: false,
    details,
  };
}

// TODO IOC for `equal` and `notEqual`: must support at least all of the following:
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

export function notEqual<T>(actual: T, expected: T, ...details: unknown[]): Fact {
  return {
    label: "notEqual",
    pass: ! isEqual(actual, expected),
    actual,
    expected,
    details,
  };
}

export function same<T>(actual: T, expected: T, ...details: unknown[]): Fact {
  return {
    label: "same",
    pass: Object.is(actual, expected),
    actual,
    expected,
    details,
  };
}

export function notSame<T>(actual: T, expected: T, ...details: unknown[]): Fact {
  return {
    label: "notSame",
    pass: ! Object.is(actual, expected),
    actual,
    expected,
    details,
  };
}

export function passed(...details: unknown[]): Fact {
  return {
    label: "passed",
    pass: true,
    details,
  };
}

export function failed(...details: unknown[]): Fact {
  return {
    label: "failed",
    pass: false,
    details,
  };
}

export const assertions = {
  ok,
  notOk,
  equal,
  notEqual,
  same,
  notSame,
  passed,
  failed,
};

type Predicate = (...args: any[]) => boolean;

/**
 * Generates a test-method from a simple assertion function.
 * 
 * This factory function assumes an input function where the first
 * argument is the actual value. Any additional parameters will be
 * reported as `details` in the generated `Fact` - the resulting
 * function will not have an `expected` value, and therefore will
 * be unable to display as a diff in reporters.
 * 
 * Works with predicates from libraries such as `validator`, `is`, etc.
 * 
 * @see https://www.npmjs.com/package/validator
 */
export function assertion<F extends Predicate>(label: string, assert: F) {
  return (...args: [...params: Parameters<F>, ...details: unknown[]]): Fact => ({
    label,
    pass: assert(...args.slice(0, assert.length)),
    actual: args[0],
    details: args.slice(1),
  });
}

/**
 * Generates test-methods from a map of simple assertion functions.
 * 
 * Works with predicates libraries such as `validator`, `is`, etc.
 * 
 * TODO check compatibility with the following:
 *      https://www.npmjs.com/package/validator
 *      https://www.npmjs.com/package/check-types
 *      https://www.npmjs.com/package/chai
 *      https://www.npmjs.com/package/is
 *      https://www.npmjs.com/package/is-what
 *      https://www.npmjs.com/package/typed-assert
 */
export function createAssertions<T extends Record<string, Predicate>>(obj: T): {
  [P in keyof T]: (...args: [...params: Parameters<T[P]>, ...details: unknown[]]) => Fact
} {
  const entries = Object.entries(obj).map(([label, assert]) => [label, assertion(label, assert)]);

  return Object.fromEntries(entries);
}
