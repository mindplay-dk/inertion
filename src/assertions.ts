import isEqual from "fast-deep-equal";
import { Collect } from "./api";

export const ok = (collect: Collect) => (actual: boolean, ...details: unknown[]) => {
  collect({
    label: "ok",
    pass: actual === true,
    actual,
    expected: true,
    details,
  });
}

export const notOk = (collect: Collect) => (actual: boolean, ...details: unknown[]) => {
  collect({
    label: "notOk",
    pass: actual === false,
    actual,
    expected: false,
    details,
  });
}

// TODO IOC for `equal` and `notEqual`: must support at least all of the following:
//      https://www.npmjs.com/package/fast-deep-equal    *DEFAULT*
//      https://www.npmjs.com/package/deep-equal
//      https://www.npmjs.com/package/deep-is

export const equal = (collect: Collect) => <T>(actual: T, expected: T, ...details: unknown[]) => {
  collect({
    label: "equal",
    pass: isEqual(actual, expected),
    actual,
    expected,
    details,
  });
}

export const notEqual = (collect: Collect) => <T>(actual: T, expected: T, ...details: unknown[]) => {
  collect({
    label: "notEqual",
    pass: ! isEqual(actual, expected),
    actual,
    expected,
    details,
  });
}

export const same = (collect: Collect) => <T>(actual: T, expected: T, ...details: unknown[]) => {
  collect({
    label: "same",
    pass: Object.is(actual, expected),
    actual,
    expected,
    details,
  });
}

export const notSame = (collect: Collect) => <T>(actual: T, expected: T, ...details: unknown[]) => {
  collect({
    label: "notSame",
    pass: ! Object.is(actual, expected),
    actual,
    expected,
    details,
  });
}

export const passed = (collect: Collect) => (...details: unknown[]) => {
  collect({
    label: "passed",
    pass: true,
    details,
  });
}

export const failed = (collect: Collect) => (...details: unknown[]) => {
  collect({
    label: "failed",
    pass: false,
    details,
  });
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

type PredicateToAssertion<F extends (...args: any) => any> =
  (collect: Collect) => (...args: [...params: Parameters<F>, ...details: unknown[]]) => void;

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
export function assertion<F extends Predicate>(label: string, assert: F): PredicateToAssertion<F> {
  return collect => (...args) => collect({
    label,
    pass: assert(...args.slice(0, assert.length)),
    actual: args[0],
    details: args.slice(1),
  });
}

// see https://www.piotrl.net/typescript-condition-subset-types/

type RemoveNevers<T> = Pick<T, {
  [K in keyof T]: T[K] extends never
    ? never
    : K
}[keyof T]>;

type PredicatesToAssertions<T> = RemoveNevers<{
  [K in keyof T]: T[K] extends Predicate
    ? PredicateToAssertion<T[K]>
    : never
}>;

/**
 * Generates test-methods from a map of simple assertion functions.
 * 
 * Works with predicate libraries - for example:
 * 
 *     https://www.npmjs.com/package/validator      √ works (requires @types/validator)
 *     https://www.npmjs.com/package/is             ~ works for predicates only (requires @types/is)
 *     https://www.npmjs.com/package/check-types    ~ works for predicates only (requires @types/check-types)
 *     https://www.npmjs.com/package/is-what        ~ works, but no support for type-guards
 *     https://www.npmjs.com/package/chai           × chai throws errors (not predicates)
 *     https://www.npmjs.com/package/typed-assert   × assertion functions (not predicates)
 */
export function createAssertions<T>(obj: T): PredicatesToAssertions<T> {
  const entries = Object.entries(obj).map(([label, assert]) => [
    label,
    typeof assert === "function"
      ? assertion(label, assert)
      : undefined
  ]);

  return Object.fromEntries(entries);
}
