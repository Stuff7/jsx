import { isBoolAttribute, watch } from "~/signals";

export * from "~/signals";

const componentSlots = [] as JSX.Slots[];

export default function jsx<T extends JSX.Tag>(
  tag: T | JSX.Component,
  attributes: { [key: string]: unknown; } | null,
  ...children: Node[]
) {
  "use JSX";
  if (typeof tag === "function") {
    if (tag === Fragment as unknown as JSX.Component) { return Fragment(null, ...children) }

    const slots = { default: [] as JSX.Slots["default"] } as JSX.Slots;
    for (const c of children) {
      const elems = (c instanceof HTMLTemplateElement ? [...c.childNodes] : c) as JSX.Element;
      if (c instanceof HTMLElement && c.slot) {
        slots[c.slot] = elems;
      }
      else {
        slots.default.push(...(elems instanceof Array ? elems : [elems]));
      }
    }

    componentSlots.push(slots);
    const ret = tag(attributes ?? {}, slots);
    componentSlots.pop();

    return ret;
  }

  type Tag = typeof tag;
  const element: HTMLElementTagNameMap[Tag] = document.createElement(tag);

  const currentSlots = componentSlots[componentSlots.length - 1];

  if (currentSlots && element instanceof HTMLSlotElement) {
    if (attributes?.name == null && currentSlots.default) {
      return currentSlots.default;
    }

    if (typeof attributes?.name === "string" && attributes.name in currentSlots) {
      return currentSlots[attributes.name];
    }

    return children;
  }

  const map = (attributes ?? {});
  const attrs = element as Record<string, unknown>;

  for (const propK in map) {
    const propV = map[propK] as unknown;
    const attr = attrs[propK];

    if (propK[0] === "$") {
      if (propK === "$ref") {
        if (propV instanceof Function) {
          queueMicrotask(() => propV(element));
        }
        else {
          queueMicrotask(() => map[propK] = element);
        }
      }
      else if (propK === "$if") {
        queueMicrotask(() => {
          const parent = element.parentElement;
          const prevSibling = element.previousSibling;
          const nextSibling = element.nextSibling;

          watch(() => {
            if (map.$if) {
              if (document.contains(element)) {
                return;
              }
              if (prevSibling && prevSibling.parentElement) {
                prevSibling.after(element);
              }
              else if (nextSibling && nextSibling.parentElement) {
                nextSibling.before(element);
              }
              else if (parent) {
                parent.append(element);
              }
            }
            else if (document.contains(element)) {
              element.remove();
            }
            else {
              queueMicrotask(() => element.remove());
            }
          });
        });
      }
    }
    else if (propK.startsWith("class:")) {
      setClass(element, map, propK, propK.slice(6));
    }
    else if (propK.startsWith("on:") && typeof propV === "function") {
      element.addEventListener(propK.slice(3), propV as EventListenerOrEventListenerObject);
    }
    else if (propK.startsWith("bind:")) {
      const k = propK.slice(5);
      if (!(propV instanceof Function)) {
        watch(() => attrs[k] = map[propK]);
        break;
      }

      watch(() => attrs[k] = propV());

      if (k === "value") {
        element.addEventListener("input", () => propV(attrs[k]));
      }
      else {
        element.addEventListener("change", () => propV(attrs[k]));
      }
    }
    else if (propK.startsWith("style:")) {
      const k = propK.slice(6);
      const updateStyle = (v: unknown) => element.style.setProperty(k, `${v}`);
      if (propV instanceof Function) {
        watch(() => updateStyle(propV()));
      }
      else {
        watch(() => updateStyle(map[propK]));
      }
    }
    else if (propK.startsWith("var:")) {
      const k = propK.slice(4);
      const updateStyle = (v: unknown) => element.style.setProperty(`--${k}`, `${v}`);
      if (propV instanceof Function) {
        watch(() => updateStyle(propV()));
      }
      else {
        watch(() => updateStyle(map[propK]));
      }
    }
    else if (propK === "class") {
      setClass(element, map, propK);
    }
    else if (isBoolAttribute(propV) || typeof propV === "number") {
      watch(() => {
        if (typeof attr === "undefined") {
          element.setAttribute(propK, `${map[propK]}`);
        }
        else {
          attrs[propK] = map[propK];
        }
      });
    }
    else if (propV instanceof Function && (isBoolAttribute(propV()) || typeof propV() === "number")) {
      watch(() => setAttribute(element, attrs, attr, propK, propV()));
    }
  }

  mountChildren(element, children);

  return element;
}

export function Fragment(_: null, ...children: JSX.Children[]) {
  return children.flat(Infinity as 1);
}

function mountChildren(element: HTMLElement, children: Node[]) {
  for (const child of children) {
    if (child instanceof Function) {
      element.append(`${child()}`);
      const node = element.childNodes[element.childNodes.length - 1];
      watch(() => node.textContent = `${child()}`);
    }
    else if (Array.isArray(child)) {
      mountChildren(element, child);
    }
    else {
      element.append(child);
    }
  }
}

function setClass(element: HTMLElement, map: Record<string, unknown>, propK: string, className?: string) {
  watch(() => {
    const classN = `${className || map[propK]}`;
    if (map[propK] === false) {
      element.classList.remove(classN);
    }
    else {
      element.classList.add(classN);
    }
  });
}

function setAttribute(
  element: HTMLElement,
  attrs: Record<string, unknown>,
  attr: unknown,
  propK: string,
  propV: unknown,
) {
  if (typeof attr === "undefined") {
    element.setAttribute(propK, `${propV}`);
  }
  else {
    attrs[propK] = propV;
  }
}

const MountEvent = new CustomEvent("mount");
const UnmountEvent = new CustomEvent("unmount");

const mountObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type !== "childList") { return }

    for (const node of mutation.addedNodes) {
      queueMicrotask(() => sendEventDeep(node, MountEvent));
    }
    for (const node of mutation.removedNodes) {
      queueMicrotask(() => sendEventDeep(node, UnmountEvent));
    }
  });
});

function sendEventDeep(node: Node, event: CustomEvent) {
  if (node.nodeType === node.ELEMENT_NODE) {
    for (const c of (node as HTMLElement).getElementsByTagName("*")) {
      c.dispatchEvent(event);
    }
  }

  node.dispatchEvent(event);
}

mountObserver.observe(document.body, { childList: true, subtree: true });
