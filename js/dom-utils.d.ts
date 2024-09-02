/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoolAttr, Ref } from "./signals";
import { Properties, PropertiesHyphen } from "csstype";

export type CSSProperties = Properties;

export type RemovePrefix<T, Prefix extends string> = T extends `${Prefix}${infer S}` ? S : T;
export type RemoveSuffix<T, Suffix extends string> = T extends `${infer S}${Suffix}` ? S : T;
export type OnEventName = Exclude<keyof GlobalEventHandlers, `${string}EventListener`>;
export type EventName = RemovePrefix<OnEventName, "on">;

declare global {
  interface GlobalEventHandlers {
    "onmount": ((this: GlobalEventHandlers, ev: Event) => void) | null,
    "onunmount": ((this: GlobalEventHandlers, ev: Event) => void) | null,
  }
}

export type GlobalEvent<T extends OnEventName> =
  GlobalEventHandlers[T] extends (((this: GlobalEventHandlers, ev: infer K) => any) | null | undefined) ? K : never;

export type EventHandlerFn<T, E> =
  E extends OnEventName ? (this: T, ev: GlobalEvent<E> & { currentTarget: T }) => void : never;

type PrefixedFn<T, K extends string, P extends string> =
  EventHandlerFn<T, `on${RemovePrefix<K, P>}`>;

export type ExtractEvent<T, P extends string> = {
  [K in `${P}${EventName}`]: (
    PrefixedFn<T, K, P> | [listener: PrefixedFn<T, K, P>, options: AddEventListenerOptions]
  ) | null;
};

export type SpecialProps = {
  "$if"?: boolean,
};

export type EventHandlers<T> = ExtractEvent<T, "on:"> & ExtractEvent<T, "win:on">;

export type Union<T> = T extends any ? T : never;
export type RefUnion<T> = T extends any ? Ref<T> : never;

export type StripPrefix<T, K, Prefix extends string> = RemovePrefix<K, Prefix> extends keyof T ?
  T[RemovePrefix<K, Prefix>] : never;

export type StyleProps = {
  [K in `style:${keyof PropertiesHyphen}`]?: Union<StripPrefix<PropertiesHyphen, K, "style:">> | string | null;
} & { [K in `var:${string}`]?: string } & { [K in `class:${string}`]?: BoolAttr };

export type Binders<T> = T & (
  keyof T extends string ? {
    [K in `bind:${keyof T}`]?: RefUnion<StripPrefix<T, K, "bind:">> | Union<StripPrefix<T, K, "bind:">>;
  } & StyleProps : never
);
