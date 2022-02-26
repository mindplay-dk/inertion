import process from "process";
import * as assertions from "../src/assertions";
import { run, setup } from "../src/harness";
import { report, statusOf } from "../src/reporting";

const test = setup(assertions);

const canRunTests = test(`can run tests`, async is => {
  const test = setup(assertions);

  const A = test(`this is a test`, async is => {
    is.equal(1, 1, "one is one");
    is.ok(true, "true is true");
  });

  const resultA = {
    description: "this is a test",
    error: undefined,
    checks: [
      {
        location: "/home/mindplay/workspace/funky-test/test/test.ts:12:8",
        fact: {
          label: "equal",
          pass: true,
          actual: 1,
          expected: 1,
          details: ["one is one"],
        },
      },
      {
        location: "/home/mindplay/workspace/funky-test/test/test.ts:13:8",
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

  const B = test(`this is another test`, async is => {
    is.ok(false, "this will fail");
  });

  const resultB = {
    description: "this is another test",
    error: undefined,
    checks: [
      {
        location: "/home/mindplay/workspace/funky-test/test/test.ts:44:8",
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

  const results = await run([A, B]);

  const checkedResults = results.map(({ time, ...rest }) => {
    is.ok(time >= 0, "it produces a time value");

    return rest;
  });

  is.equal(checkedResults, [resultA, resultB], "it produces the expected test results");
});

(async () => {
  const results = await run([
    canRunTests
  ]);

  report(results, console);

  process.exit(statusOf(results));
})();
