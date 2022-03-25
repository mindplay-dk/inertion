import { Check, Fact, Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { isFailed } from "../src/reporting";
import { FactoryMap } from "./container";

/**
 * 0: print descriptions of failed tests only
 * 1: print all descriptions (with check counts)
 * 2: print all descriptions (with check counts) and checks (with details)
 */
export type Verbosity = 0 | 1 | 2;

export interface Reporter {
  printReport(results: Result[]): void;
  print(line: string): void;
  format(value: unknown): string;
  formatValue(value: unknown): string | undefined;
  formatError(error: Error): string;
  formatDetails(values: unknown[]): string;
}

const formatValue = ({ format }: Pick<Reporter, "format">) => (value: unknown): string | undefined => {
  return value !== undefined ? format(value) : undefined;
}

const formatError = ({ format }: Pick<Reporter, "format">) => (error: Error): string => {
  return (error instanceof UnknownError
    ? `Unknown error:\n` + format(error.value)
    : "") + error.stack;
}

const formatDetails = ({ format }: Pick<Reporter, "format">) => (details: unknown[]): string => {
  return typeof details[0] === "string"
    ? details[0] + (details.length > 1 ? "\n" + format(details.slice(1)) : "")
    : format(details);
}

const printReport = ({ print, format, formatValue }: Pick<Reporter, "print"| "format" | "formatValue">) => (results: Result[]): void => {
  for (const result of results) {
    const { description, time } = result;

    const pass = ! isFailed(result);

    const numChecks = result.checks.length;
    const numPassed = result.checks.filter(({ fact }) => ! fact.pass).length;

    print(`${pass ? "PASS" : "FAIL"} [${numPassed}/${numChecks}] ${description} (${time}ms)`);

    const error = result.error
      ? (result.error instanceof UnknownError ? `Unknown error:\n` + format(result.error.value) : "") + "\n" + result.error.stack
      : undefined;

    if (error) {
      print(error);
    }

    print("");
    
    for (const { fact, location } of result.checks) {
      const { label, pass } = fact;

      if (! pass) {
        const actual = formatValue(fact.actual);
        const expected = formatValue(fact.expected);

        const [title, ...details] = fact.details;
  
        if (typeof title === "string") {
          print(`* [${label}] ${title}`);
          print(`ACTUAL: ${actual}`);
          print(`EXPECTED: ${expected}`);
        } else {
          print(`* [${label}]`);
        }

        print(`  at ${location}`)

        if (details.length) {
          print(`DETAILS\n:${format(fact.details.slice(1))}`);
        }

        print("");
      }
    }
  }

  const failed = results.filter(isFailed).length;
  const passed = results.length - failed;
  
  let time = 0;

  for (const result of results) {
    time += result.time;
  }

  print(`TESTS: ${passed + failed}`);
  print(`PASSED: ${passed}`);
  print(`FAILED: ${failed}`);
};

export const bootstrap: FactoryMap<Reporter> = {
  printReport,
  print: () => (line: string) => console.log(line),
  format: () => (value: string) => JSON.stringify(value, null, 2),
  formatValue,
  formatError,
  formatDetails,
}
