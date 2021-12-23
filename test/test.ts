import process from "process";
import isEqual from "fast-deep-equal";
import { createSink } from "../src/sink";

let success = false;

function ok(pass: boolean, message: string) {
  success = success && pass;

  console.log(pass ? "🆗" : "❌", message);
}

(async () => {
  await test_event_stream();

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

    ok(isEqual(result, [1,2,3,4,5]), "it yields the entire result");
    ok(isEqual(logged, [1,2,3,5,4]), "nested emitters immediately start running");
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

    ok(!!caught, "it throws if a value arrives too late");
    ok(caught!.message === `late value!`, "it has an error message");
  }
}
