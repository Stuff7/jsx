const context = [] as Running<never>[];

type Running<T> = {
  execute<K extends keyof T>(key: K, value: T[K]): void;
  dependencies: Set<Listeners<T>>;
};

type Listeners<T> = Set<Running<T>>;

export type Reactive<T> = T & {
  listeners: Listeners<T>,
};

export type Ref<T> = Reactive<{
  value: T,
}>;

export type BoolAttr = boolean | "true" | "false";

export type ReactiveAttr = Ref<string> | Ref<boolean> | string | boolean;

export function ref<T>(value: T): Ref<T> {
  const p: Ref<T> = { value, listeners: new Set as Ref<T>["listeners"] };
  return new Proxy<Ref<T>>(p, { get, set });
}

export function reactive<T extends object>(props: T): Reactive<T> {
  (props as Reactive<T>).listeners = new Set();
  return new Proxy<Reactive<T>>(props as Reactive<T>, { get, set });
}

export function watch<T>(fn: Running<T>["execute"], deps: Reactive<unknown>[] = []) {
  const execute: Running<T>["execute"] = (key, value) => {
    cleanup(running);
    context.push(running);
    try {
      fn(key, value);
      deps.forEach(dep => dep.listeners);
    }
    finally {
      context.pop();
    }
  };

  const running: Running<T> = {
    execute,
    dependencies: new Set(),
  };

  execute("" as keyof T, "" as T[keyof T]);
}

export function computed<T>(fn: () => T) {
  const c = ref(fn());
  watch(() => c.value = fn());
  return c;
}

function get<T, R extends Reactive<T>>(target: R, key: string | symbol) {
  const running = context[context.length - 1];
  if (running) { subscribe(running, target.listeners) }
  return target[key];
}

function set<T, R extends Reactive<T>>(target: R, key: string | symbol, val: never) {
  target[key] = val;

  for (const sub of [...target.listeners]) {
    sub.execute(key as keyof T, val);
  }
  return true;
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
