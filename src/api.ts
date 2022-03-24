import { UnknownError } from "./harness";

export type MethodMap = {
  [name: string]: TestMethod;
}

export type TestMethod = {
  (...args: any[]): Fact;
}

export type ContextFactory<T> = () => T;

export type TestFactory<T extends MethodMap, C> = {
  (description: string, spec: Spec<T, C>): Test<T, C>;
}

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
  [K in keyof T]: (...args: Parameters<T[K]>) => void;
}

export type Fact = {
  label: string;
  pass: boolean;
  actual: unknown;
  expected: unknown;
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
