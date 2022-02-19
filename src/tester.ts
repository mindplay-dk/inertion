// my assertions:

function ok(actual: unknown, ...details: unknown[]): Check {
  return {
    label: "ok",
    pass: actual === true,
    actual,
    expected: true,
    details,
  };
}

function equal(actual: unknown, expected: unknown, ...details: unknown[]): Check {
  return {
    label: "ok",
    pass: actual === expected,
    actual,
    expected,
    details,
  };
}

const assertions = {
  ok,
  equal,
};

// my test:

const test = setup(assertions);

const test1 = test(`this is a test`, async is => {
  is.equal(1, 1, "one is one");
  is.ok(true, "true is true");
});

const test2 = test(`this is another test`, async is => {
  is.ok(false, "this will fail");
});

(async () => {
  const result = await run([test1, test2]);

  console.log(result); // and eventually: report(result);
})();

// my API:

type MethodMap = {
  [name: string]: TestMethod;
}

type TestMethod = {
  (...args: any[]): Check;
}

type TestFactory<T extends MethodMap> = {
  (description: string, spec: Spec<T>): Test<T>;
}

type Spec<T extends MethodMap> = {
  (tester: Tester<T>): Promise<void>;
}

type Test<T extends MethodMap> = {
  assertions: T;
  description: string;
  spec: Spec<T>;
}

type Tester<T extends MethodMap> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => void;
}

type Check = {
  label: string;
  pass: boolean;
  actual: any;
  expected: any;
  details: any[];
}

type Result = {
  description: string;
  checks: Check[];
}

// my framework:

function setup<T extends MethodMap>(assertions: T): TestFactory<T> {
  return (description, spec) => ({ assertions, description, spec });
}

async function run(tests: Array<Test<any>>): Promise<Result[]> {
  return Promise.all(tests.map(runTest));
}

async function runTest<T extends MethodMap>({ assertions, description, spec }: Test<T>): Promise<Result> {
  const checks: Check[] = [];

  let collect = (check: Check) => {
    checks.push(check);
  };

  const tester = Object.fromEntries(
    Object.entries(assertions)
      .map(([name, assertion]) => [name, (...args: any) => {
        collect(assertion(...args));
      }])
  ) as Tester<T>;

  await spec(tester);

  collect = () => {
    throw new Error(`attempted assertion after end of test`);
  };

  return {
    description,
    checks,
  };
}
