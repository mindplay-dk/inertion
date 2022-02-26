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

export function equal<T>(actual: T, expected: T, ...details: unknown[]): Fact {
  return {
    label: "equal",
    pass: isEqual(actual, expected),
    actual,
    expected,
    details,
  };
}
