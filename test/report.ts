import { Check, Fact, Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { isFailed } from "../src/reporting";

interface Report {
  passed: number;
  failed: number;
  time: number;
  results: Array<{
    description: string;
    pass: boolean;
    time: number;
    error: string | undefined;
    checksPassed: number;
    checksFailed: number;
    facts: Array<{
      label: string;
      pass: boolean;
      actual: string | undefined;
      expected: string | undefined;
      details: string | undefined;
    }>;
  }>;
}

type Formatter = (value: unknown) => string;

function createReport(results: Result[], format: Formatter): Report {
  const failed = results.filter(isFailed).length;
  const passed = results.length - failed;
  
  let time = 0;

  for (const result of results) {
    time += result.time;
  }

  return {
    passed,
    failed,
    time,
    results: results.map(result => ({
      description: result.description,
      pass: ! isFailed(result),
      time: result.time,
      error: result.error
        ? (result.error instanceof UnknownError ? `Unknown error:\n` + format(result.error.value) : "") + result.error.stack
        : undefined,
      checksPassed: result.checks.filter(({ fact }) => fact.pass).length,
      checksFailed: result.checks.filter(({ fact }) => ! fact.pass).length,
      facts: result.checks.map(({ fact: { label, pass, actual, expected, details }, location }) => ({
        label,
        pass,
        actual: actual !== undefined ? format(actual) : undefined,
        expected: expected !== undefined ? format(expected) : undefined,
        details: typeof details[0] === "string"
          ? details[0] + (details.length > 1 ? "\n" + format(details.slice(1)) : "")
          : format(details)
      })),
    })),
  };
}

// verbosity options:
//
//   0: print descriptions of failed tests only
//   1: print all descriptions (with check counts)
//   2: print all descriptions (with check counts) and checks (with details)

type Verbosity = 0 | 1 | 2;

const verbosityOptions: Verbosity[] = [0, 1, 2];

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

console.log(JSON.stringify(createReport(createSampleResults(), v => JSON.stringify(v, null, 2))));
