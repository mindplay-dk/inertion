export type MethodMap = {
  [name: string]: TestMethod;
}

export type TestMethod = {
  (...args: unknown[]): Fact;
}

export type TestFactory<T extends MethodMap> = {
  (description: string, spec: Spec<T>): Test<T>;
}

export type Spec<T extends MethodMap> = {
  (tester: Tester<T>): Promise<void>;
}

export type Test<T extends MethodMap> = {
  methods: T;
  description: string;
  spec: Spec<T>;
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
  error: unknown;
}
