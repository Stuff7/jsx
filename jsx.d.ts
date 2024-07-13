export type BoolAttr = boolean | "true" | "false";

type Listeners<T> = { listeners: ((value: T, key: string | symbol) => void)[] };

export type Ref<T> = {
  value: T,
} & Listeners<T>;

export type Reactive<T extends object> = T & Listeners<T[keyof T]>;

export type ReactiveAttr = Ref<string> | Ref<boolean> | string | boolean;
