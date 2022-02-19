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
    label: "equal",
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
  methods: T;
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

type Assertion = {
  location: string;
  check: Check;
}

type Result = {
  description: string;
  assertions: Assertion[];
  time: number;
  error: unknown;
}

// my framework:

function setup<T extends MethodMap>(methods: T): TestFactory<T> {
  return (description, spec) => ({ methods, description, spec });
}

async function run(tests: Array<Test<any>>): Promise<Result[]> {
  return Promise.all(tests.map(runTest));
}

async function runTest<T extends MethodMap>({ methods, description, spec }: Test<T>): Promise<Result> {
  const assertions: Assertion[] = [];

  let collect = (assertion: Assertion) => {
    assertions.push(assertion);
  };

  const tester = Object.fromEntries(
    Object.entries(methods)
      .map(([name, assertion]) => [name, (...args: any) => {
        const location = new Error().stack.split("\n").pop().trim();

        const check = assertion(...args);

        collect({ location, check });
      }])
  ) as Tester<T>;

  const started = Date.now();

  let error: unknown;

  try {
    await spec(tester);
  } catch (e: unknown) {
    error = e;
  }

  const time = Date.now() - started;

  collect = () => {
    throw new Error(`attempted assertion after end of test "${description}" - please check your code for missing await statements.`);
  };

  return {
    description,
    assertions,
    time,
    error,
  };
}
