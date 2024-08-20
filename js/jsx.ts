import { isRef, isBoolAttribute, watch } from "~/signals";

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

    if (propK === "ref" && isRef(propV)) {
      queueMicrotask(() => propV.value = element);
    }
    else if (propK === "class") {
      setClass(element, map, propK);
    }
    else if (propK[0] !== "$" && !propK.includes(":") && (isBoolAttribute(propV) || typeof propV === "number")) {
      watch(() => {
        if (typeof attr === "undefined") {
          element.setAttribute(propK, `${map[propK]}`);
        }
        else {
          attrs[propK] = map[propK];
        }
      });
    }
    else if (propK.startsWith("class:")) {
      setClass(element, map, propK, propK.slice(6));
    }
    else if (propK.startsWith("on:") && typeof propV === "function") {
      element.addEventListener(propK.slice(3), propV as EventListenerOrEventListenerObject);
    }
    else if (propK.startsWith("bind:")) {
      const k = propK.slice(5);
      if (!isRef(propV)) {
        watch(() => attrs[k] = map[propK]);
        break;
      }

      watch(() => attrs[k] = propV.value);

      if (k === "value") {
        element.addEventListener("input", () => propV.value = attrs[k]);
      }
      else {
        element.addEventListener("change", () => propV.value = attrs[k]);
      }
    }
    else if (propK.startsWith("style:")) {
      const k = propK.slice(6);
      const updateStyle = (v: unknown) => element.style.setProperty(k, `${v}`);
      if (isRef(propV)) {
        watch(() => updateStyle(propV.value));
      }
      else {
        watch(() => updateStyle(map[propK]));
      }
    }
    else if (propK.startsWith("var:")) {
      const k = propK.slice(4);
      const updateStyle = (v: unknown) => element.style.setProperty(`--${k}`, `${v}`);
      if (isRef(propV)) {
        watch(() => updateStyle(propV.value));
      }
      else {
        watch(() => updateStyle(map[propK]));
      }
    }
    else if (isRef(propV) && (isBoolAttribute(propV.value) || typeof propV.value === "number")) {
      watch(() => setAttribute(element, attrs, attr, propK, propV.value));
    }
  }

  for (const child of children) {
    if (isRef(child)) {
      element.append(`${child.value}`);
      const node = element.childNodes[element.childNodes.length - 1];
      watch(() => node.textContent = `${child.value}`);
    }
    else if (child instanceof Function) {
      element.append(`${child()}`);
      const node = element.childNodes[element.childNodes.length - 1];
      watch(() => node.textContent = `${child()}`);
    }
    else if (Array.isArray(child)) {
      element.append(...child);
    }
    else {
      element.append(child);
    }
  }

  if (typeof attributes?.["$if"] === "boolean") {
    queueMicrotask(() => {
      const parent = element.parentElement;
      const prevSibling = element.previousSibling;
      const nextSibling = element.nextSibling;

      watch(() => {
        if (attributes["$if"]) {
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

  return element;
}

export function Fragment(_: null, ...children: JSX.Children[]) {
  return children.flat(Infinity as 1);
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
