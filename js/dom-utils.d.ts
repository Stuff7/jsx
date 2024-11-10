/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoolAttr, Ref } from "./signals";
import { Properties, PropertiesHyphen } from "csstype";

export type Option<T> = T | null | undefined;

export type CSSProperties = Properties;

export type RemovePrefix<T, Prefix extends string> = T extends `${Prefix}${infer S}` ? S : T;
export type RemoveSuffix<T, Suffix extends string> = T extends `${infer S}${Suffix}` ? S : T;
export type OnEventName = Exclude<keyof GlobalEventHandlers, `${string}EventListener`>;
export type EventName = RemovePrefix<OnEventName, "on">;

declare global {
  interface GlobalEventHandlers {
    "onmount": Option<(this: GlobalEventHandlers, ev: Event) => void>,
    "onunmount": Option<(this: GlobalEventHandlers, ev: Event) => void>,
    "ondestroy": Option<(this: GlobalEventHandlers, ev: Event) => void>,
    "onfullscreenchange": Option<(this: GlobalEventHandlers, ev: Event) => void>,
  }
}

export type GlobalEvent<T extends OnEventName> =
  GlobalEventHandlers[T] extends Option<(this: GlobalEventHandlers, ev: infer K) => any> ? K : never;

export type EventHandlerFn<T, E> =
  E extends OnEventName ? (this: T, ev: GlobalEvent<E> & { currentTarget: T }) => void : never;

type PrefixedFn<T, K extends string, P extends string> =
  EventHandlerFn<T, `on${RemovePrefix<K, P>}`>;

export type ExtractEvent<T, P extends string> = {
  [K in `${P}${EventName}`]: Option<
    PrefixedFn<T, K, P> | [listener: PrefixedFn<T, K, P>, options: AddEventListenerOptions]
  >;
};

export type SpecialProps = {
  "$if"?: boolean,
};

export type EventHandlers<T> = ExtractEvent<T, "on:"> & ExtractEvent<T, "g:on">;

export type Union<T> = T extends any ? T : never;
export type RefUnion<T> = T extends any ? Ref<T> : never;

export type StripPrefix<T, K, Prefix extends string> = RemovePrefix<K, Prefix> extends keyof T ?
  T[RemovePrefix<K, Prefix>] : never;

export type StyleProps = {
  [K in `style:${keyof PropertiesHyphen}`]?: Option<Union<StripPrefix<PropertiesHyphen, K, "style:">> | string>;
} & {
  [K in `var:${string}`]?: Option<string>;
} & {
  [K in `class:${string}`]?: Option<BoolAttr>;
} & {
  $transition?: Option<BoolAttr>;
} & {
  [K in `$transition:${string}`]?: Option<BoolAttr>;
};

export type Binders<T> = T & (
  keyof T extends string ? {
    [K in `$${keyof T}`]?: Option<Union<StripPrefix<T, K, "$">>>;
  } & StyleProps : never
);
