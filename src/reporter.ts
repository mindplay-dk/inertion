import { Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { FactoryMap } from "./container";
import format from "pretty-format";
import { Change, diffLines, diffWordsWithSpace } from "diff";
import colors from "ansi-colors";

/**
 * Enhancement to the `diffLines` function: produces `Change` records for individual lines.
 */
function diffIndividualLines(oldStr: string, newStr: string): Change[] {
  return diffLines(oldStr, newStr)
    .map(({ value, added, removed }) => value
      .split("\n")
      .filter(line => line !== "")
      .map(value => ({ value, added, removed }))
    )
    .flat();
}

export function isFailed(result: Result): boolean {
  return result.error !== undefined || result.checks.some(({ fact }) => !fact.pass);
}

/**
 * 0: print descriptions of failed tests only
 * 1: print all descriptions (with check counts)
 * 2: print all descriptions (with check counts) and checks (with details)
 */
export type Verbosity = 0 | 1 | 2;

export interface Reporter {
  printReport(results: Result[]): void;
  print(line: string): void;
  prefix(prefix: string, text: string): string;
  format(value: unknown): string;
  formatError(error: Error): string;
  formatDetails(values: unknown[]): string;
  formatDiagnostic(actual: unknown, expected: unknown): string;
}

const prefix = (prefix: string, text: string) => prefix + text.replace(/\n/g, `$&${" ".repeat(prefix.length)}`);

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

const formatDiagnostic = ({ format }: Pick<Reporter, "format">) => (actual: unknown, expected: unknown): string => {
  const $actual = format(actual);
  const $expected = format(expected);

  const sameTypes = typeof actual === typeof expected;

  const singleLines = ($actual.indexOf("\n") === -1) && ($expected.indexOf("\n") === -1);

  if (expected === undefined) {
    return singleLines
      ? `  ${colors.bgRed.white(" × ")} ACTUAL: ${$actual}`
      : `  ${colors.bgRed.white(" × ")} ACTUAL:\n${prefix("      ", $actual)}`;
  }
  
  if (sameTypes && singleLines) {
    const diff = diffWordsWithSpace($actual, $expected);

    return (
      `  ACTUAL:   ` + diff.map(({ value, added, removed }) => added ? "" : removed ? colors.bgRed.white(value) : value).join("") +
      "\n" +
      `  EXPECTED: ` + diff.map(({ value, added, removed }) => added ? colors.bgGreen.white(value) : removed ? "" : value).join("")
    );
  }
  
  if (sameTypes) {
    return diffIndividualLines($actual, $expected)
      .map(({ value, added, removed }) => 
        added
          ? `  ${colors.bgGreen.white(" √ ")} ${value}`
          : removed
            ? `  ${colors.bgRed.white(" × ")} ${value}`
            : `      ${value}`
      )
      .join("\n");
  }

  if (singleLines) {
    return (
      `  ${colors.bgRed.white(" × ")} ACTUAL:   ${$actual}\n` +
      `  ${colors.bgGreen.white(" √ ")} EXPECTED: ${$expected}`
    );
  }

  // different types, multiple lines - in this case, diffing doesn't make any sense:

  return (
    `  ${colors.bgRed.white(" × ")} ACTUAL:\n` + prefix("      ", $actual) + "\n" +
    `  ${colors.bgGreen.white(" √ ")} EXPECTED:\n` + prefix("      ", $expected)
  );
}

const printReport = ({ print, format, prefix, formatDiagnostic }: Pick<Reporter, "print"| "format" | "prefix" | "formatDiagnostic">) => (results: Result[]): void => {
  for (const result of results) {
    const { description, time } = result;

    const pass = ! isFailed(result);

    print(`${pass ? "PASSED" : "FAILED"}: ${description} (${time}ms)`);

    const error = result.error
      ? (result.error instanceof UnknownError ? `Unknown error:\n` + format(result.error.value) : "") + "\n" + result.error.stack
      : undefined;

    if (error) {
      print(prefix("  ", error));
    }

    print("");
    
    for (const { fact, location } of result.checks) {
      const { pass, label, actual, expected } = fact;

      if (! pass) {
        const [title, ...details] = typeof fact.details[0] === "string" && fact.details[0].indexOf("\n") === -1
          ? fact.details
          : ["", ...fact.details];
  
        print(`  × [${label}] ${title}`);
        print(`  └ ${location}`)

        if (actual !== undefined || expected !== undefined) {
          print("");
          print(formatDiagnostic(actual, expected));
        }

        if (details.length) {
          print(`  DETAILS:\n${prefix("  ", format(details))}`);
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

  print(`√ PASSED: ${passed}`);
  print(`× FAILED: ${failed}`);
  print(`  TOTAL:  ${passed + failed}`);
};

// yuck, but: https://github.com/facebook/jest/issues/12609
const formatString = {
  test(value: unknown) {
    return typeof value === "string";
  },
  serialize(value: string, _: any, indentation: string) {
    if (value.indexOf("\n") === -1) {
      return JSON.stringify(value);
    }
    
    return value
      .split(/(?<=\n)/g)
      .map(line => JSON.stringify(line))
      .join(`\n${indentation}+ `);
  }
};

export const bootstrap: FactoryMap<Reporter> = {
  printReport,
  print: () => (line: string) => console.log(line),
  prefix: () => prefix,
  format: () => (value: string) => format(value, { plugins: [formatString] }),
  formatError,
  formatDetails,
  formatDiagnostic,
}
