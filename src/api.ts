import { Message } from "./protocol";
import { Payload } from "./sink";

export type MessagePayload = Payload<Message>;

export type none = null | undefined;

export type Spec<T extends MethodMap> = (tester: Invoker<T>) => Promise<void>;

export type MethodMap = {
  [name: string]: TestMethod;
}

export type TestMethod = (...args: any[]) => Payload<Message>;

export type Assertion = (...args: any[]) => Result;

export type Result = {
  pass: boolean;
  actual: any;
  expected: any;
  details: any[];
}

export type Invoker<T extends MethodMap> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => void;
}

export type Recorder = (message: Payload<Message>) => void;

export type Tester<T extends MethodMap> = (description: string, spec: Spec<T>) => void;
