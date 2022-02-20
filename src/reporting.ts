import { Result } from "./api";

export function statusOf(results: Result[]): number {
  return isSuccess(results) ? 1 : 0;
}

export function isSuccess(results: Result[]): boolean {
  return results.some(result =>
    result.error || result.assertions.some(({ check }) => !check.pass)
  );
}

export function report(results: Result[], console: Console): void {
  console.log(`${results.length} tests completed\n`);

  for (const result of results) {
    console.log(`"${result.description}"\n`);

    for (const { check, location } of result.assertions) {
      console.log(
        check.pass ? "✅" : "❌",
        `[${check.label}]`,
        ...check.details.map(value => JSON.stringify(value))
      );

      if (!check.pass) {
        console.log(`  location:`, location);
        console.log(`  actual:  `, check.actual);
        console.log(`  expected:`, check.expected);
      }
    }
  }
}
