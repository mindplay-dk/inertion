import process from "process";
import { Result } from "../src/api";
import * as assertions from "../src/assertions";
import { run, setup } from "../src/harness";
import { isSuccess, report, statusOf } from "../src/reporting";
import { failingTest, passingTest } from "./cases";

const test = setup(assertions);

(async () => {
  const results = await run([
    test(`can run passing and failing tests`, async is => {
      const expectedFromPassingTest: Omit<Result, "time"> = {
        description: "this is a test",
        error: undefined,
        checks: [
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:7:6",
            fact: {
              label: "equal",
              pass: true,
              actual: 1,
              expected: 1,
              details: ["one is one"],
            },
          },
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:8:6",
            fact: {
              label: "ok",
              pass: true,
              actual: true,
              expected: true,
              details: ["true is true"],
            },
          },
        ],
      };
      
      const expectedFromFailingTest: Omit<Result, "time"> = {
        description: "this is another test",
        error: undefined,
        checks: [
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:12:6",
            fact: {
              label: "ok",
              pass: true,
              actual: true,
              expected: true,
              details: ["this will succeed"],
            },
          },
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:13:6",
            fact: {
              label: "ok",
              pass: false,
              actual: false,
              expected: true,
              details: ["this will fail"],
            },
          },
        ],
      };      
    
      const results = await run([passingTest, failingTest]);
    
      const checkedResults = results.map(({ time, ...rest }) => {
        is.ok(time >= 0, "it produces a time value");
    
        return rest;
      });

      is.equal(checkedResults, [expectedFromPassingTest, expectedFromFailingTest], "it produces the expected test results");
    
      is.equal(isSuccess(results), false, "isSuccess() returns false when any tests fail");
    }),

    test(`can run passing test`, async is => {
      const results = await run([passingTest]);
    
      is.equal(isSuccess(results), true, "isSuccess() returns true when all tests succeed");
    }),
  ]);

  report(results, console);

  process.exit(statusOf(results));
})();
