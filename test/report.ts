import { Check, Fact, Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { printReport } from "../src/reporting";

function createSampleResults(): Result[] {
  let results: Result[] = [];

  // we want to see all combinations of actual/expected values and pass/fail:

  const valueModes: Record<string, Pick<Fact, "actual" | "expected">> = {
    "no actual or expected": { actual: undefined, expected: undefined },
    "actual only (single-line)": { actual: "actual only, single-line", expected: undefined },
    "actual only (multi-line)": { actual: "actual only\nmulti-line", expected: undefined },
    "actual and expected (both single-line)": { actual: "actual, single-line", expected: "expected, single-line" },
    "actual and expected (multi-line)": { actual: "actual\nmulti-line", expected: "expected\nmulti-line" },
  };

  for (const [values, valueMode] of Object.entries(valueModes)) {
    let checks: Check[] = [];

    for (const pass of [true, false]) {
      checks.push({
        location: `at test.js:1:1`,
        fact: {
          label: "ok",
          pass,
          ...valueMode,
          details: [],
        }
      });
    }

    results.push({ description: values, time: 0.123, error: undefined, checks });
  }

  // we want to see some basic pass/fail checks in combination with different error modes:

  const basicChecks: Check[] = [true, false].map(pass => ({
    location: `at test.js:1:1`,
    fact: {
      label: "ok",
      pass,
      actual: undefined,
      expected: undefined,
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
      checks: basicChecks.map(check => ({ ...check, ...detailMode })),
      time: 0.123,
    });
  }

  return results;
}

printReport(createSampleResults());
