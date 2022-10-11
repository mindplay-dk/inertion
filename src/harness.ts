import { Check, ContextFactory, MethodMap, Result, Test, Tester, TestRegistry, TestSuite } from "./api";

export function setup<T extends MethodMap, C>(methods: T, createContext?: ContextFactory<C>): TestSuite<T, C> & TestRegistry<T, C> {
  const tests: Array<Test<T, C>> = [];

  const registry: TestRegistry<T, C> = (description, spec) => {
    tests.push({
      methods,
      createContext: createContext || (() => null as any),
      description,
      spec,
    });
  };

  const suite = {
    [Symbol.iterator]() {
      return tests[Symbol.iterator]();
    }
  };

  return Object.assign(registry, suite);
}

export async function run(...tests: Array<Iterable<Test<any,any>>>): Promise<Result[]> {
  return Promise.all(tests.map(test => [...test].map(runTest)).flat());
}

/**
 * This `Error`-type represents capture `throw` statements with a non-`Error` type.
 * 
 * TODO maybe keep the value formatting internal to this class? remove formatting from `createReport` in here, and remove the `UnknownError` type from `Fact.error`?
 */
export class UnknownError extends Error {
  constructor(public readonly value: unknown) {
    super("Unknown error type");
  }
}

export async function runTest<T extends MethodMap, C>({ methods, createContext, description, spec }: Test<T, C>): Promise<Result> {
  const checks: Check[] = [];

  let checked = (check: Check) => {
    checks.push(check);
  };

  const tester = Object.fromEntries(
    Object.entries(methods)
      .map(([name, assertion]) => [name, (...args: any) => {
        const location = getLocation(new Error());

        const fact = assertion(...args);

        checked({ location, fact });
      }])
  ) as Tester<T>;

  const started = Date.now();

  let error: Error | undefined;

  try {
    await spec(tester, createContext());
  } catch (e: unknown) {
    error = e instanceof Error ? e : new UnknownError(e);
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

const STACK_TRACE_PATTERN = /^\s+at /; // matches the start of stack-trace lines

const PATH_PATTERN = /\(([^)]+)\)/g; // matches path in e.g.: `null.<anonymous> (/home/user/path/to/test/cases.ts:35:6)`

export function getLocation(error: Error) {
  const stack = error.stack;

  if (stack) {
    const line = stack
      .split("\n")
      .filter(line => STACK_TRACE_PATTERN.test(line))[1]; // remove preamble under Node

    if (line) {
      const clean = line.replace(STACK_TRACE_PATTERN, "");

      const match = [...clean.matchAll(PATH_PATTERN)];

      if (match[0] && match[0][1]) {
        return match[0][1]; // the path is parenthesized
      }

      return clean;
    }
  }

  return "(unknown)";
}
