declare namespace JSX {
  type Element = HTMLElement;
  type Children = HTMLElement | string | number | object | Children[];
  type IntrinsicElements = import("./dom.d.ts").HTMLElementAttributeMap;

  type Tag = keyof HTMLElementTagNameMap;
  type Slots = Record<string, () => JSX.Element> & { default: () => JSX.Element[] };

  type Component = (props: Record<string, unknown> | null, slots: Slots) => Node;
}

declare type ValueOf<T> = T[keyof T];
