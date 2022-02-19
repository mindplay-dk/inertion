export type Async<T> = {
  [K in keyof T as `$${string & K}`]: Promise<T[K]>;
}

export type FactoryMap<T> = {
  [K in keyof T]: (f: Omit<T, K>) => T[K];
}

export function createContainer<T>(factory: FactoryMap<T>): T {
  const container = {} as T;

  const instances = {} as { [key: string]: any };
  
  const has = Object.prototype.hasOwnProperty.bind(instances);

  for (const key in factory) {
    Object.defineProperty(
      container,
      key,
      {
        get() {
          if (! has(key)) {
            instances[key] = factory[key](container);
          }

          return instances[key];
        },
        configurable: true,
        enumerable: true,
      }
    );
  }

  return container;
}
