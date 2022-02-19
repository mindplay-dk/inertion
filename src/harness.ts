import { MethodMap, Recorder, Spec } from "./api";
import { createInvoker } from "./invoker";
import { runSpec } from "./spec";

export interface Harness<T extends MethodMap> {

}

export function createFactory<T extends MethodMap>(methods: T) /*: Harness<T> */ {
  return {
    createInvoker: (record: Recorder) => createInvoker<T>(methods, record),
    createTester: (record: Recorder) => (description: string, spec: Spec<T>) => {}
  }
}

export function createHarness<T extends MethodMap>(methods: T) {
  const factory = createFactory(methods);

  return {
    runSpec: (spec: Spec<T>) => runSpec(methods, spec)
  }
}
