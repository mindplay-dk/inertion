import { Result } from "./api";
import util from "util";
import { createContainer } from "./container";
import { bootstrap, isFailed, Reporter } from "./reporter";

export function statusOf(results: Result[]): number {
  return isSuccess(results) ? 1 : 0;
}

export function isSuccess(results: Result[]): boolean {
  return results.some(isFailed) === false;
}

const inspect = (...values: unknown[]) => util.inspect(values, { depth: 99, maxArrayLength: 999, colors: true });

export const { printReport } = createContainer<Reporter>(bootstrap);

// TODO `Console` compatible subset abstraction, with implementations for node and browser consoles

export function reportTo(console: Console, results: Result[]): void {
  // TODO add proper reporting
  //
  //      - pick a formatter:
  //        https://github.com/facebook/jest/tree/main/packages/pretty-format
  //        https://github.com/hildjj/node-inspect-extracted
  //
  //      - or fork this one?
  //        https://github.com/commenthol/serialize-to-js
  //
  //      - add diffing:
  //        https://www.npmjs.com/package/diff
  //        
  //        see note here about picking between character/line diff:
  //        https://github.com/lorenzofox3/zora/issues/127

  console.log(`${results.length} tests completed\n`);

  for (const result of results) {
    console.log(`"${result.description}"\n`);

    for (const { fact: check, location } of result.checks) {
      console.log(
        check.pass ? "✅" : "❌",
        `[${check.label}]`,
        ...check.details
      );

      if (!check.pass) {
        console.log(`  location:`, location);
        console.log(`  actual:  `, inspect(check.actual));
        console.log(`  expected:`, inspect(check.expected));
      }
    }
  }
}
