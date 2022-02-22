import { Assertion, MethodMap, Result, Test, Tester, TestFactory } from "./api";

export function setup<T extends MethodMap>(methods: T): TestFactory<T> {
  return (description, spec) => ({ methods, description, spec });
}

export async function run(tests: Array<Test<any>>): Promise<Result[]> {
  return Promise.all(tests.map(runTest));
}

export async function runTest<T extends MethodMap>({ methods, description, spec }: Test<T>): Promise<Result> {
  const assertions: Assertion[] = [];

  let collect = (assertion: Assertion) => {
    assertions.push(assertion);
  };

  const tester = Object.fromEntries(
    Object.entries(methods)
      .map(([name, assertion]) => [name, (...args: any) => {
        const location = new Error().stack!
          .split("\n")[2]
          .replace(/^\s+at /, "");

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
