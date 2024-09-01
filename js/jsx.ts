import { isBoolAttribute, watch } from "~/signals";
import { EventName } from "./dom-utils";

export * from "~/signals";

const componentSlots = [] as JSX.Slots[];

export default function jsx<T extends JSX.Tag>(
  tag: T | JSX.Component,
  attributes: { [key: string]: unknown; } | null,
  ...children: Node[]
): Node {
  "use JSX";
  if (typeof tag === "function") {
    if (tag === Fragment as unknown as JSX.Component) { return Fragment(null, ...children) as unknown as Node }

    const slots = { default: [] as JSX.Slots["default"] } as JSX.Slots;
    for (const c of children) {
      const elems = (c instanceof HTMLTemplateElement ? [...c.childNodes] : c) as JSX.Element;
      if (c instanceof HTMLElement && c.slot) {
        slots[c.slot] = elems;
      }
      else if (elems instanceof Array) {
        slots.default.push(...elems);
      }
      else {
        slots.default.push(elems);
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
      return currentSlots.default as unknown as Node;
    }

    if (typeof attributes?.name === "string" && attributes.name in currentSlots) {
      return currentSlots[attributes.name];
    }

    return children as unknown as Node;
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
    else if (propK.startsWith("on:")) {
      if (typeof propV === "function") {
        element.addEventListener(propK.slice(3), propV as () => void);
      }
      else if (propV instanceof Array) {
        element.addEventListener(propK.slice(3), propV[0], propV[1]);
      }
    }
    else if (propK.startsWith("win:on")) {
      if (typeof propV === "function") {
        addWindowEventListener(element, propK.slice(6) as EventName, propV as () => void);
      }
      else if (propV instanceof Array) {
        addWindowEventListener(element, propK.slice(6) as EventName, propV[0], propV[1]);
      }
    }
    else if (propK.startsWith("bind:")) {
      const k = propK.slice(5);
      if (!(propV instanceof Array)) {
        watch(() => attrs[k] = map[propK]);
        break;
      }

      const [get, set] = propV;
      if (!(get instanceof Function) || !(set instanceof Function)) {
        break;
      }

      watch(() => attrs[k] = get());

      if (k === "value") {
        element.addEventListener("input", () => set(attrs[k]));
      }
      else {
        element.addEventListener("change", () => set(attrs[k]));
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

function addWindowEventListener(target: EventTarget, typ: EventName, fn: () => void, opts?: AddEventListenerOptions) {
  window.addEventListener(typ, fn, opts);
  const events = WIN_EVENTS.get(target);
  if (!events) {
    WIN_EVENTS.set(target, [[typ, [{ fn, opts }]]]);
    return;
  }

  const ev = events.find(e => e[0] === typ);
  if (!ev) {
    events.push([typ, [{ fn, opts }]]);
    return;
  }

  ev[1].push({ fn, opts });
}

function mountChildren(element: HTMLElement, children: Node[]) {
  for (const child of children) {
    if (child instanceof Function) {
      const ret = child();
      if (ret instanceof Element) {
        element.append(ret);
        continue;
      }

      element.append(`${ret}`);
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

type AddEventParams = { fn: () => void, opts?: AddEventListenerOptions };

const WIN_EVENTS = new WeakMap<EventTarget, [EventName, AddEventParams[]][]>;
const MountEvent = new CustomEvent("mount");
const UnmountEvent = new CustomEvent("unmount");

const mountObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type !== "childList") { return }

    for (const node of mutation.addedNodes) {
      queueMicrotask(() => {
        iterChildrenDeep(node, node => {
          const events = WIN_EVENTS.get(node);
          if (events && events.length) {
            events.forEach(([e, handlers]) => {
              handlers.forEach(h => {
                window.addEventListener(e, h.fn, h.opts);
              });
            });
          }

          node.dispatchEvent(MountEvent);
        });
      });
    }
    for (const node of mutation.removedNodes) {
      queueMicrotask(() => {
        iterChildrenDeep(node, node => {
          const events = WIN_EVENTS.get(node);
          if (events && events.length) {
            events.forEach(([e, handlers]) => {
              handlers.forEach(h => {
                window.removeEventListener(e, h.fn, h.opts);
              });
            });
          }

          node.dispatchEvent(UnmountEvent);
        });
      });
    }
  });
});

function iterChildrenDeep(node: Node, fn: (node: EventTarget) => void) {
  if (node.nodeType === node.ELEMENT_NODE) {
    for (const c of (node as HTMLElement).getElementsByTagName("*")) {
      fn(c);
    }
  }

  fn(node);
}

mountObserver.observe(document.body, { childList: true, subtree: true });
