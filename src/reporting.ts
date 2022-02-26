import { Result } from "./api";
import util from "util";

export function statusOf(results: Result[]): number {
  return isSuccess(results) ? 1 : 0;
}

export function isSuccess(results: Result[]): boolean {
  return results.some(isFailed) === false;
}

export function isFailed(result: Result): boolean {
  return !!result.error || result.checks.some(({ fact }) => !fact.pass);
}

const inspect = (...values: unknown[]) => util.inspect(values, { depth: 99, maxArrayLength: 999, colors: true });

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
