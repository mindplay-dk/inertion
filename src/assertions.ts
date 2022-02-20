import isEqual from "fast-deep-equal";
import { Check } from "./api";

export function ok(actual: unknown, ...details: unknown[]): Check {
  return {
    label: "ok",
    pass: actual === true,
    actual,
    expected: true,
    details,
  };
}

export function equal(actual: unknown, expected: unknown, ...details: unknown[]): Check {
  return {
    label: "equal",
    pass: isEqual(actual, expected),
    actual,
    expected,
    details,
  };
}
