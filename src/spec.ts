import { MethodMap, Spec } from "./api";
import { createInvoker } from "./invoker";
import { Message } from "./protocol";
import { createSink } from "./sink";

export async function* runSpec<T extends MethodMap>(methods: T, spec: Spec<T>) {
  yield* createSink<Message>(async emit => {
    const invoker = createInvoker(methods, emit);

    await spec(invoker);
  });
}
