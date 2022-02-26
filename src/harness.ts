import { Check, ContextFactory, MethodMap, Result, Test, Tester, TestFactory } from "./api";

export function setup<T extends MethodMap, C>(methods: T, createContext?: ContextFactory<C>): TestFactory<T, C> {
  return (description, spec) => ({
    methods,
    createContext: createContext || (() => null as any),
    description,
    spec,
  });
}

export async function run(tests: Array<Test<any,any>>): Promise<Result[]> {
  return Promise.all(tests.map(runTest));
}

export async function runTest<T extends MethodMap, C>({ methods, createContext, description, spec }: Test<T, C>): Promise<Result> {
  const checks: Check[] = [];

  let checked = (check: Check) => {
    checks.push(check);
  };

  const tester = Object.fromEntries(
    Object.entries(methods)
      .map(([name, assertion]) => [name, (...args: any) => {
        const location = new Error().stack!
          .split("\n")[2]
          .replace(/^\s+at /, "");

        const fact = assertion(...args);

        checked({ location, fact });
      }])
  ) as Tester<T>;

  const started = Date.now();

  let error: unknown;

  try {
    await spec(tester, createContext());
  } catch (e: unknown) {
    error = e;
  }

  const time = Date.now() - started;

  checked = () => {
    throw new Error(`attempted assertion after end of test "${description}" - please check your code for missing await statements.`);
  };

  return {
    description,
    checks,
    time,
    error,
  };
}
