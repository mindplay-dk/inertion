import { Check, Fact, Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { printReport } from "../src/reporting";

/**
 * How do you "test" what the output of a reporter looks like? 🤔
 * 
 * An actual test can't verify the visual fidelity or subjective quality of the
 * report - so instead of a test, the approach here is to synthesize a set of
 * results with all the possible permutations, and then run the reporter, so
 * we can see what it all looks like.
 */
function createSampleResults(): Result[] {
  let results: Result[] = [];

  // we want to see all combinations of actual/expected values and pass/fail:

  class Foo {
    public bar = [1, 2, 3];
  }

  const valueModes: Record<string, Pick<Fact, "actual" | "expected">> = {
    "no actual or expected": { },
    "actual only (single-line)": { actual: "actual only, single-line" },
    "actual only (multi-line)": { actual: "actual only\nmulti-line" },
    "actual and expected (single-line, same types)": { actual: "actual, single-line", expected: "expected, single-line" },
    "actual and expected (single-line, different types)": { actual: "actual", expected: 123 },
    "actual and expected (multi-line, same types)": { actual: { value: "actual\nmulti-line", same: true }, expected: { value: "expected\nmulti-line", same: true } },
    "actual and expected (multi-line, different types)": { actual: "actual", expected: new Foo() },
  };

  for (const [values, valueMode] of Object.entries(valueModes)) {
    let checks: Check[] = [];

    for (const pass of [true, false]) {
      checks.push({
        location: `test.js:1:1`,
        fact: {
          label: "ok",
          pass,
          ...valueMode,
          details: [values],
        }
      });
    }

    results.push({ description: values, time: 0.123, error: undefined, checks });
  }

  // we want to see some basic pass/fail checks in combination with different error modes:

  const basicChecks: Check[] = [true, false].map(pass => ({
    location: `test.js:1:1`,
    fact: {
      label: "ok",
      pass,
      details: []
    }
  }));

  const resultModes: Record<string, Pick<Result, "error" | "checks">> = {
    "no error": { error: undefined, checks: basicChecks },
    "has error": { error: new Error(`oh no`), checks: basicChecks },
    "unknown error": { error: new UnknownError({ oops: "oh no" }), checks: basicChecks },
  };
 
  for (const [result, resultMode] of Object.entries(resultModes)) {
    results.push({
      description: result,
      ...resultMode,
      time: 0.123,
    });
  }

  // we want to see some basic pass/fail checks in combination with various modes of detail:

  const detailModes: Record<string, Pick<Fact, "details">> = {
    "no details": { details: [] },
    "one single-line detail": { details: ["details, single-line"] },
    "multiple lines or details": { details: ["details\nmulti-line", "more details"] },
  };

  for (const [details, detailMode] of Object.entries(detailModes)) {
    results.push({
      description: details,
      error: undefined,
      checks: basicChecks.map(check => ({ ...check, fact: { ...check.fact, ...detailMode } })),
      time: 0.123,
    });
  }

  return results;
}

printReport(createSampleResults());
