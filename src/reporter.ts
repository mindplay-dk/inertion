import { Result } from "../src/api";
import { UnknownError } from "../src/harness";
import { isFailed } from "../src/reporting";
import { FactoryMap } from "./container";
import format from "pretty-format";

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

const printReport = ({ print, format, prefix }: Pick<Reporter, "print"| "format" | "prefix">) => (results: Result[]): void => {
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
          print(prefix(`  ACTUAL:   `, format(actual)));
          print(prefix(`  EXPECTED: `, format(expected)));
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
}
