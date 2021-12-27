import process from "process";
import isEqual from "fast-deep-equal";
import { createSink, isAsyncIterable, Payload } from "../src/sink";
import { createInvoker } from "../src/invoker";
import { Message } from "../src/protocol";
import { ok } from "../src/assertions";
import { runSpec } from "../src/spec";

let success = false;

function check(pass: boolean, message: string) {
  success = success && pass;

  console.log(pass ? "🆗" : "❌", message);
}

(async () => {
  await test_event_stream();
  await test_invoker();
  await test_run_spec();

  process.exit(success ? 0 : 1);
})();

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, 20));
}

async function test_event_stream() {
  console.log("Event streams");

  const logged: number[] = [];

  const log = (number: number) => { logged.push(number) };
  
  const numbers = createSink<number>(async emit => {
    log(1);
    emit(1);
    await wait(20);
    log(2);
    emit(2);

    emit(createSink<number>(async emit => {
      log(3);
      emit(3);
      await wait(20);
      log(4);
      emit(4);  
    }));

    log(5);
    emit(5);
  });

  {
    let result: number[] = [];

    for await (let n of numbers) {
      result.push(n!);
    }

    check(isEqual(result, [1,2,3,4,5]), "it yields the entire result");
    check(isEqual(logged, [1,2,3,5,4]), "nested emitters immediately start running");
  }

  {
    async function failure(emit: (f: Function) => void) {
      emit(() => {
        emit(() => {});
      });
    }

    let result: Function[] = [];

    for await (let n of createSink(failure)) {
      result.push(n!);
    }

    let caught: Error | undefined;

    try {
      result.forEach(f => f());
    } catch (e) {
      caught = e as Error;
    }

    check(!!caught, "it throws if a value arrives too late");
    check(caught!.message === `late value!`, "it has an error message");
  }
}

async function test_invoker() {
  console.log("Invokers");

  const log: Message[] = [];

  const record = async (message: Payload<Message>) => {
    if (!isAsyncIterable(message)) {
      log.push(message);
    }
  };

  const invoker = createInvoker({ ok }, record);

  invoker.ok(true, "test 1");
  invoker.ok(false, "test 2");

  const expected = [
    {
      type: "Asserted",
      result: {
        pass: true,
        actual: true,
        expected: true,
        details: ["test 1"],
      },
    },
    {
      type: "Asserted",
      result: {
        pass: true,
        actual: false,
        expected: true,
        details: ["test 2"],
      },
    },
  ];

  check(
    isEqual(log, expected),
    `can invoke test-methods and record results - expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(log)}`,
  );
}

async function test_run_spec() {
  const methods = { ok };

  const result = runSpec(methods, async is => {
    is.ok(true, "test 1");
    is.ok(false, "test 2");
  });

  const log: Message[] = [];

  for await (const item of result) {
    log.push(item);
  }

  const expected = [
    {
      type: "Asserted",
      result: {
        pass: true,
        actual: true,
        expected: true,
        details: ["test 1"],
      },
    },
    {
      type: "Asserted",
      result: {
        pass: true,
        actual: false,
        expected: true,
        details: ["test 2"],
      },
    },
  ];

  check(
    isEqual(log, expected),
    `can invoke test-methods and record results - expected: ${JSON.stringify(expected)}, actual: ${JSON.stringify(log)}`,
  );
}
