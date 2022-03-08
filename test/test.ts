import process from "process";
import { Result } from "../src/api";
import assertions from "../src/assertions";
import { run, setup } from "../src/harness";
import { isSuccess, reportTo, statusOf } from "../src/reporting";
import { failingTest, passingTest, createTestWithContext, createTestWithCustomAssertion } from "./cases";

const test = setup(assertions);

(async () => {
  const results = await run([
    test(`can run passing and failing tests`, async is => {
      const expectedFromPassingTest: Omit<Result, "time"> = {
        description: "this is a test",
        error: undefined,
        checks: [
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:9:6",
            fact: {
              label: "equal",
              pass: true,
              actual: 1,
              expected: 1,
              details: ["one is one"],
            },
          },
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:10:6",
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
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:14:6",
            fact: {
              label: "ok",
              pass: true,
              actual: true,
              expected: true,
              details: ["this will succeed"],
            },
          },
          {
            location: "/home/mindplay/workspace/funky-test/test/cases.ts:15:6",
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

    test(`can create unique contexts`, async is => {
      const testWithContext = createTestWithContext();

      const results = await run([testWithContext, testWithContext])

      is.equal(results[0].checks[0].fact.actual, 1);
      is.equal(results[1].checks[0].fact.actual, 2);
    }),

    test(`can bootstrap test-methods from assertions`, async is => {
      const result = await run([createTestWithCustomAssertion]);

      is.equal(
        result.map(({ time, ...rest }) => rest),
        [
          {
            description: 'custom assertion',
            checks: [
              {
                location: '/home/mindplay/workspace/funky-test/test/cases.ts:29:6',
                fact: {
                  label: 'even',
                  pass: true,
                  actual: 2,
                  expected: undefined,
                  details: ['ok', 'sure']
                }
              },
              {
                location: '/home/mindplay/workspace/funky-test/test/cases.ts:30:6',
                fact: {
                  label: 'even',
                  pass: false,
                  actual: 1,
                  expected: undefined,
                  details: ['nope']
                }
              }
            ],
            error: undefined
          }
        ]
      );
    }),

    test(`ok/notOk assertions make strict boolean comparisons`, async is => {
      const a = {}, b = {};

      is.equal(
        assertions.ok(true, a, b),
        { label: "ok", pass: true, actual: true, expected: true, details: [a, b] }
      );

      is.equal(
        assertions.notOk(false, a, b),
        { label: "notOk", pass: true, actual: false, expected: false, details: [a, b] }
      );

      const nonBooleans: any[] = ["false", "true", 1, 0, null, undefined, {}];

      for (const actual of nonBooleans) {
        is.equal(
          assertions.ok(actual, a, b),
          { label: "ok", pass: false, actual, expected: true, details: [a, b] }
        );
  
        is.equal(
          assertions.notOk(actual, a, b),
          { label: "notOk", pass: false, actual, expected: false, details: [a, b] }
        );
      }
    }),
    
    test(`same/notSame assertions make strict (identity) comparisons`, async is => {
      const a = { a: 1 }, b = { a: 1 };

      const same: [any, any][] = [
        [a, a],
        [null, null],
        [true, true],
        [false, false],
        ["aaa", "aaa"],
        [NaN, NaN]
      ];

      const notSame: [any, any][] = [
        [a, b],
        [null, undefined],
        ["aaa", "bbb"],
        [+0, -0],
      ];

      for (const [actual, expected] of same) {
        is.equal(
          assertions.same(actual, expected, a, b),
          { label: "same", pass: true, actual, expected, details: [a, b] }
        );

        is.equal(
          assertions.notSame(actual, expected, a, b),
          { label: "notSame", pass: false, actual, expected, details: [a, b] }
        );
      }

      for (const [actual, expected] of notSame) {
        is.equal(
          assertions.same(actual, expected, a, b),
          { label: "same", pass: false, actual, expected, details: [a, b] }
        );

        is.equal(
          assertions.notSame(actual, expected, a, b),
          { label: "notSame", pass: true, actual, expected, details: [a, b] }
        );
      }
    }),

    test(`equal/notEqual assertions make deep comparisons (using fast-deep-equal)`, async is => {
      // NOTE: this test is non-exhaustive, since `fast-deep-equal` is well tested already.
      
      const a = {}, b = {};

      const equals: [any, any][] = [
        [1, 1],
        ["aaa", "aaa"],
        [{}, {}],
        [{ a: 1, b: "bbb", c: [1, 2] }, { a: 1, b: "bbb", c: [1, 2] }],
      ];

      for (const [actual, expected] of equals) {
        is.equal(
          assertions.equal(actual, expected, a, b),
          { label: "equal", pass: true, actual, expected, details: [a, b] },
        );  

        is.equal(
          assertions.notEqual(actual, expected, a, b),
          { label: "notEqual", pass: false, actual, expected, details: [a, b] },
        );
      }

      const nonEquals: [any, any][] = [
        [1, 2],
        ["aaa", "bbb"],
        [{}, { a: 1 }],
        [{ a: 1, b: "bbb", c: [1, 2] }, { a: 2, b: "bbb", c: [1, 2] }],
        [{ a: 1, b: "bbb", c: [1, 2] }, { a: 1, b: "bbb", c: [1] }],
      ];

      for (const [actual, expected] of nonEquals) {
        is.equal(
          assertions.equal(actual, expected, a, b),
          { label: "equal", pass: false, actual, expected, details: [a, b] },
        );  

        is.equal(
          assertions.notEqual(actual, expected, a, b),
          { label: "notEqual", pass: true, actual, expected, details: [a, b] },
        );
      }
    }),
  ]);

  reportTo(console, results);

  process.exit(statusOf(results));
})();
