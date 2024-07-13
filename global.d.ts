declare namespace JSX {
  type Element = HTMLElement;
  type Children = HTMLElement | string | number | object | Children[];
  type IntrinsicElements = import("./dom.d.ts").HTMLElementAttributeMap;

  type Tag = keyof HTMLElementTagNameMap;

  type Component = {
    (properties?: { [key: string]: unknown }, ...children: Node[]): Node
  };
}

declare type ValueOf<T> = T[keyof T];
