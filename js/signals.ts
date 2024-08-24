const context = [] as Running<never>[];

type Running<T> = {
  execute(value: T): void;
  dependencies: Set<Listeners<T>>;
};

type Listeners<T> = Set<Running<T>>;

export type Ref<T> = [get: (() => T) & { listeners: Listeners<T> }, set: (v: T) => void];

export type BoolAttr = boolean | "true" | "false";

export type ReactiveAttr = Ref<string> | Ref<boolean> | string | boolean;

export function watch<T>(fn: Running<T>["execute"]) {
  const execute: Running<T>["execute"] = (value) => {
    cleanup(running);
    context.push(running);
    try {
      fn(value);
    }
    finally {
      context.pop();
    }
  };

  const running: Running<T> = {
    execute,
    dependencies: new Set(),
  };

  execute(undefined as T);
}

/**
 * Works like `watch` but it only subscribes to the specified dependencies (deps)
 * and ignores any other accesses from within the callback (fn).
 * */
export function watchOnly<T>(deps: (Ref<unknown>[0])[], fn: Running<T>["execute"]) {
  const execute: Running<T>["execute"] = (value) => {
    cleanup(running);

    deps.forEach(dep => {
      subscribe(running, dep.listeners);
    });

    try {
      fn(value);
    }
    finally {
      context.pop();
    }
  };

  const running: Running<T> = {
    execute,
    dependencies: new Set(),
  };

  execute(undefined as T);
}

export function ref<T>(value: T): Ref<T> {
  const listeners: Listeners<T> = new Set;

  return [
    Object.assign(() => {
      const running = context[context.length - 1];
      if (running) { subscribe(running, listeners) }
      return value;
    }, { listeners }),
    (val: T) => {
      const prev = value;
      // eslint-disable-next-line no-param-reassign
      value = val;

      for (const sub of [...listeners]) {
        sub.execute(prev);
      }
    },
  ];
}

function subscribe<T>(running: Running<T>, subscriptions: Listeners<T>) {
  subscriptions.add(running);
  running.dependencies.add(subscriptions);
}

function cleanup<T>(running: Running<T>) {
  for (const dep of running.dependencies) {
    dep.delete(running);
  }
  running.dependencies.clear();
}

export function isBoolAttribute(value: unknown): value is BoolAttr {
  return typeof value === "string" || typeof value === "boolean";
}
