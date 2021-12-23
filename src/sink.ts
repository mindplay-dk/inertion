export type Emitter<T> = (push: (value: T | AsyncIterable<T>) => void) => Promise<void>;

export function createSink<T>(emitter: Emitter<T>): AsyncIterable<T> {
  const values: Array<T | AsyncIterable<T>> = [];

  let push = (value: T | AsyncIterable<T>) => {
    values.push(value);
  };

  const done = emitter(value => push(value));

  async function* collect() {
    await done;

    push = () => {
      throw new Error(`late value!`); // TODO improve error message
    }

    for (const value of values) {
      if (isAsyncIterable<T>(value)) {
        yield* value;
      } else {
        yield value;
      }
    }
  }
  
  return collect();
}

export function isAsyncIterable<T>(value: T | AsyncIterable<T>): value is AsyncIterable<T> {
  return !!(value as any)[Symbol.asyncIterator];
}
