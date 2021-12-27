import { MethodMap, Invoker, Recorder } from "./api";

export function createInvoker<T extends MethodMap>(methods: T, record: Recorder): Invoker<T> {
  const names = Object.keys(methods) as Array<keyof T>;
  
  const entries = names.map(name => [
    name,
    (...args: any) => {
      record(methods[name](...args));
    }
  ]);

  return Object.fromEntries(entries);
}
