const context = [] as Running<never>[];

export type Running<T> = {
  execute(value: T): void;
  dependencies: Set<Listeners<T>>;
};

type Listeners<T> = Set<Running<T>>;

export type Reactive<T> = T & {
  listeners: Listeners<T>,
};

export type Ref<T> = [
  get: (() => T) & { listeners: Listeners<T> },
  set: ((v: T) => void) & {
    byRef: (mutFn: (currentV: T) => void) => void;
    byRefAsync: (mutFn: (currentV: T) => Promise<void>) => Promise<void>;
  },
];

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

  return running;
}

/**
 * Works like `watch` but it only subscribes to the specified dependencies (deps)
 * and ignores any other accesses from within the callback (fn).
 * */
export function watchOnly<T>(deps: ({ listeners: Listeners<unknown> })[], fn: Running<T>["execute"]) {
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

  return running;
}

/**
 * Works like `watchOnly` but only watches the dependencies used in `depsFn`.
 * */
export function watchFn<T>(deps: () => unknown, fn: Running<T>["execute"]) {
  const execute: Running<T>["execute"] = (value) => {
    cleanup(running);
    context.push(running);

    try {
      deps();
    }
    finally {
      context.pop();
    }

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

  return running;
}

export function ref<T>(value: T = undefined as T): Ref<T> {
  const listeners: Listeners<T> = new Set;
  let v = value;

  const get = () => {
    const running = context[context.length - 1];
    if (running) { subscribe(running, listeners) }
    return v;
  };

  const set = (newV: T) => {
    const prev = v;
    v = newV;

    for (const sub of [...listeners]) {
      sub.execute(prev);
    }
  };

  return [
    Object.assign(get, { listeners }),
    Object.assign(
      set,
      {
        byRef: (mutFn: (currentV: T) => void) => {
          mutFn(v);
          set(v);
        },
        byRefAsync: async (mutFn: (currentV: T) => Promise<void>) => {
          await mutFn(v);
          set(v);
        },
      },
    ),
  ];
}

export function reactive<T extends object>(objValue: T): Reactive<T> {
  const obj = objValue as Reactive<T>;
  Object.defineProperty(obj, "listeners", {
    value: new Set(),
    enumerable: false,
    configurable: true,
  });

  for (const k in obj) {
    let v = obj[k];
    Object.defineProperty(obj, k, {
      get: () => {
        const running = context[context.length - 1];
        if (running) { subscribe(running, obj.listeners) }
        return v;
      },
      set: (newV) => {
        const prev = v;
        v = newV;
        for (const sub of [...obj.listeners]) {
          sub.execute(prev);
        }
      },
    });
  }

  return obj;
}

export function isReactiveObject<T extends object>(value: T): value is Reactive<T> {
  return "listeners" in value && value.listeners instanceof Set;
}

function subscribe<T>(running: Running<T>, subscriptions: Listeners<T>) {
  subscriptions.add(running);
  running.dependencies.add(subscriptions);
}

export function cleanup<T>(running: Running<T>) {
  for (const dep of running.dependencies) {
    dep.delete(running);
  }
  running.dependencies.clear();
}

export function isBoolAttribute(value: unknown): value is BoolAttr {
  return typeof value === "string" || typeof value === "boolean";
}
