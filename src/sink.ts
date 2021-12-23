export type Emitter<T> = (emit: (value: T | AsyncIterable<T>) => void) => Promise<void>;

export function createSink<T>(emitter: Emitter<T>): AsyncIterable<T> {
  const sink: Array<T | AsyncIterable<T>> = [];

  let accept = (value: T | AsyncIterable<T>) => {
    sink.push(value);
  };

  const done = emitter(value => accept(value));

  return {
    [Symbol.asyncIterator]: async function* () {
      await done;

      accept = () => {
        throw new Error(`late value!`); // TODO improve error message
      }

      for (const value of sink) {
        if (isAsyncIterable<T>(value)) {
          yield* value;
        } else {
          yield value;
        }
      }
    }
  }
}

export function isAsyncIterable<T>(value: any): value is AsyncIterable<T> {
  return !!value[Symbol.asyncIterator];
}
