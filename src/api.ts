import { UnknownError } from "./harness";

export type MethodMap = {
  [name: string]: TestMethod;
}

export type Collect = (fact: Fact) => void;

export type TestMethod = (collect: Collect) => (...args: any[]) => void; // TODO Promise<void> return-type would allow for async assertion-methods - do we want that?

export type ContextFactory<T> = () => T;

export type TestRegistry<T extends MethodMap, C> = {
  (description: string, spec: Spec<T, C>): void;
}

export type TestSuite<T extends MethodMap, C> = Iterable<Test<T, C>>;

export type Spec<T extends MethodMap, C> = {
  (tester: Tester<T>, context: C): Promise<void>;
}

export type Test<T extends MethodMap, C> = {
  methods: T;
  createContext: ContextFactory<C>;
  description: string;
  spec: Spec<T, C>;
}

export type Tester<T extends MethodMap> = {
  [K in keyof T]: ReturnType<T[K]>;
}

export type Fact = {
  label: string;
  pass: boolean;
  actual?: unknown;
  expected?: unknown;
  details: unknown[];
}

export type Check = {
  location: string;
  fact: Fact;
}

export type Result = {
  description: string;
  checks: Check[];
  time: number;
  error: Error | UnknownError | undefined;
}
