import process from "process";
import { Result, Fact, TestMethod } from "../src/api";
import { assertions, createAssertions } from "../src/assertions";
import { getLocation, run, setup, UnknownError } from "../src/harness";
import { printReport, isSuccess, statusOf } from "../src/reporting";
import { failingTest, passingTest, createTestWithContext, testWithCustomAssertion, testWithUnexpectedError, testWithUnexpectedUnknownError } from "./cases";
import { isSameType } from "../src/is-same-type";
import validator from "validator";

const test = setup(assertions);

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

  const results = await run(passingTest, failingTest);

  const checkedResults = results.map(({ time, ...rest }) => {
    is.ok(time >= 0, "it produces a time value");

    return rest;
  });

  is.equal(checkedResults, [expectedFromPassingTest, expectedFromFailingTest], "it produces the expected test results");

  is.equal(isSuccess(results), false, "isSuccess() returns false when any tests fail");

  is.equal(statusOf(results), 1, "statusOf() returns 1 when any tests fail");
});

test(`can run passing test`, async is => {
  const results = await run(passingTest);

  is.equal(isSuccess(results), true, "isSuccess() returns true when all tests succeed");

  is.equal(statusOf(results), 0, "statusOf() returns 0 when any tests fail");
});

test(`can create unique contexts`, async is => {
  const testWithContext = createTestWithContext();

  const results = await run(testWithContext, testWithContext);

  is.equal(results[0].checks[0].fact.actual, 1);
  is.equal(results[1].checks[0].fact.actual, 2);
});

test(`can bootstrap test-methods from assertions`, async is => {
  const result = await run(testWithCustomAssertion);

  is.equal(
    result.map(({ time, ...rest }) => rest),
    [
      {
        description: 'custom assertion',
        checks: [
          {
            location: '/home/mindplay/workspace/funky-test/test/cases.ts:35:6',
            fact: {
              label: 'even',
              pass: true,
              actual: 2,
              details: ['ok', 'sure']
            }
          },
          {
            location: '/home/mindplay/workspace/funky-test/test/cases.ts:36:6',
            fact: {
              label: 'even',
              pass: false,
              actual: 1,
              details: ['nope']
            }
          }
        ],
        error: undefined
      }
    ]
  );
});

function collect<T extends TestMethod>(method: T) {
  return (...args: Parameters<ReturnType<T>>) => {
    var facts: Fact[] = [];

    method(fact => { facts.push(fact) })(...args);

    return facts;
  }
}

test(`ok/notOk assertions make strict boolean comparisons`, async is => {
  const a = {}, b = {};

  is.equal(
    collect(assertions.ok)(true, a, b),
    [{ label: "ok", pass: true, actual: true, expected: true, details: [a, b] }]
  );

  is.equal(
    collect(assertions.notOk)(false, a, b),
    [{ label: "notOk", pass: true, actual: false, expected: false, details: [a, b] }]
  );

  const nonBooleans: any[] = ["false", "true", 1, 0, null, undefined, {}];

  for (const actual of nonBooleans) {
    is.equal(
      collect(assertions.ok)(actual, a, b),
      [{ label: "ok", pass: false, actual, expected: true, details: [a, b] }]
    );

    is.equal(
      collect(assertions.notOk)(actual, a, b),
      [{ label: "notOk", pass: false, actual, expected: false, details: [a, b] }]
    );
  }
});

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

  for (const [actual, expected] of same) {
    is.equal(
      collect(assertions.same)(actual, expected, a, b),
      [{ label: "same", pass: true, actual, expected, details: [a, b] }]
    );

    is.equal(
      collect(assertions.notSame)(actual, expected, a, b),
      [{ label: "notSame", pass: false, actual, expected, details: [a, b] }]
    );
  }

  const notSame: [any, any][] = [
    [a, b],
    [null, undefined],
    ["aaa", "bbb"],
    [+0, -0],
  ];

  for (const [actual, expected] of notSame) {
    is.equal(
      collect(assertions.same)(actual, expected, a, b),
      [{ label: "same", pass: false, actual, expected, details: [a, b] }]
    );

    is.equal(
      collect(assertions.notSame)(actual, expected, a, b),
      [{ label: "notSame", pass: true, actual, expected, details: [a, b] }]
    );
  }
});

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
      collect(assertions.equal)(actual, expected, a, b),
      [{ label: "equal", pass: true, actual, expected, details: [a, b] }],
    );  

    is.equal(
      collect(assertions.notEqual)(actual, expected, a, b),
      [{ label: "notEqual", pass: false, actual, expected, details: [a, b] }],
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
      collect(assertions.equal)(actual, expected, a, b),
      [{ label: "equal", pass: false, actual, expected, details: [a, b] }],
    );  

    is.equal(
      collect(assertions.notEqual)(actual, expected, a, b),
      [{ label: "notEqual", pass: true, actual, expected, details: [a, b] }],
    );
  }
});

test(`can manually pass or fail tests`, async is => {
  const a = {}, b = {};

  is.equal(
    collect(assertions.passed)(a, b),
    [{ label: "passed", pass: true, details: [a, b] }],
  );

  is.equal(
    collect(assertions.failed)(a, b),
    [{ label: "failed", pass: false, details: [a, b] }],
  );
});

test(`can capture unexpected errors`, async is => {
  const results = await run(testWithUnexpectedError, testWithUnexpectedUnknownError);

  is.ok(results[0].error instanceof Error);
  is.ok(results[1].error instanceof UnknownError, "it should convert unknown error types to UnknownError instances");
});

test(`can test for same types`, async is => {
  class A {}
  class B extends A {}

  /**
   * Tuples of same-type values
   */
  const values: unknown[][] = [
    [1, 0.0, NaN],   // all numbers are numbers (even NaN)
    ["a", ""],       // empty string is a string
    [null],          // null is a distinct type
    [undefined],     // undefined is a distinct type
    [{}, { a: 1 }],  // all POJOs are the same type
    [new A()],       // classes have distinct types
    [new B()],       // every class is distinct
    [[], [1, 2, 3]], // all arrays are the same type
    [Symbol("a")],   // Symbols represent distinct types (see `unique symbol` in TypeScript)
    [Symbol("a")],   // even similar Symbols have distinct types
    // all functions are regarded as the same type:
    [A, B, function () {}, () => {}, async function () {}, async () => {}],
  ];

  values.forEach((as, indexA) => {
    values.forEach((bs, indexB) => {
      as.forEach(a => {
        bs.forEach(b => {
          if (indexA === indexB) {
            is.ok(isSameType(a, b), "same types", a, b);
          } else {
            is.ok(! isSameType(a, b), "not same types", a, b);
          }
        });
      });
    });
  });
});

test(`can map predicates to assertions`, async is => {
  const a = createAssertions({
    truthy(value: unknown) {
      return !!value;
    },
    falsy(value: unknown) {
      return !value;
    }
  });

  is.equal(collect(a.truthy)(true)[0].label, "truthy");
  is.equal(collect(a.falsy)(false)[0].label, "falsy");
  is.equal(collect(a.truthy)(true)[0].actual, true);
  is.equal(collect(a.truthy)(false)[0].actual, false);
  is.equal(collect(a.truthy)(true)[0].expected, undefined, "predicates have no expected value");
  is.equal(collect(a.truthy)(true)[0].details, []);
  is.equal(collect(a.truthy)(true, 1, 2)[0].details, [1, 2]);
  is.equal(collect(a.truthy)(true)[0].pass, true);
  is.equal(collect(a.truthy)(false)[0].pass, false);
});

test(`can use a third-party validator library`, async is => {
  const a = createAssertions(validator);

  is.equal(collect(a.isCreditCard)("4929 7226 5379 7141")[0].pass, true);
  is.equal(collect(a.isCreditCard)("4929 7226 5379 7149")[0].pass, false);

  is.equal((a as any).version, undefined, "non-function properties are omitted");
});

test(`can get call site location from Error instance`, async is => {
  is.equal(
    getLocation({ stack: "Error\n    at /home/user/file1.ts:123:45\n    at /home/user/file2.ts:123:45" } as unknown as Error, 1),
    "/home/user/file2.ts:123:45",
    `can parse source-location with path in parens (e.g. tsx)`
  );

  is.equal(
    getLocation({ stack: "Error\n    at null.<anonymous> (/home/user/file1.ts:123:45)" } as unknown as Error, 0),
    "/home/user/file1.ts:123:45",
    `can parse source-location (e.g. node, ts-node, browsers)`
  );

  is.equal(
    getLocation({ stack: "?????" } as unknown as Error, 99),
    "(unknown)",
    `can handle malformed stack-trace`
  );

  is.equal(
    getLocation({ stack: undefined } as unknown as Error, 0),
    "(unknown)",
    `can handle mising stack-trace`
  );
});

(async () => {
  const results = await run(test);

  printReport(results);

  process.exit(statusOf(results));
})();
