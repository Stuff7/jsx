import { EventName } from "./dom-utils";
import { watch } from "./signals";

export function template(html: string) {
  const createNode = () => {
    const templ = document.createElement("template");
    templ.innerHTML = html;
    return templ.content.firstChild!;
  };

  let node!: Node;
  return () => (node || (node = createNode())).cloneNode(true);
}

type EventHandler = (e: Event) => void;

type GlobalEventListeners = {
  fn: EventHandler,
  target: Element,
  once?: boolean,
};

export function createGlobalEvent(evName: EventName) {
  const listeners = [] as GlobalEventListeners[];

  (evName === "resize" ? window : document).addEventListener(evName, (e) => {
    for (let i = listeners.length - 1; i >= 0; i--) {
      const l = listeners[i];
      for (const t of iterParents(e.target)) {
        if (t === l.target) {
          l.fn(e);
          if (l.once) {
            listeners[i] = listeners[listeners.length - 1];
            listeners.length--;
          }
        }
      }
    }
  });

  return listeners;
}

function* iterParents(elem: EventTarget | null) {
  let parent = elem;
  do {
    yield parent;
  }
  while (parent instanceof Element && (parent = parent.parentElement));
}

export function addGlobalEvent(
  listeners: GlobalEventListeners[],
  target: GlobalEventListeners["target"],
  value: EventHandler | [EventHandler, AddEventListenerOptions],
) {
  if (value instanceof Array) {
    listeners.push({ fn: value[0], once: value[1].once, target });
  }
  else {
    listeners.push({ fn: value, target });
  }
}

export function addLocalEvent(
  target: Element,
  evName: EventName,
  value: EventHandler | [EventHandler, AddEventListenerOptions],
) {
  if (value instanceof Array) {
    target.addEventListener(evName, value[0], value[1]);
  }
  else {
    target.addEventListener(evName, value);
  }
}

export function conditionalRender(
  anchor: Comment,
  create: () => Element,
  condition: () => boolean,
) {
  let node: Element;

  watch(() => {
    if (condition()) {
      anchor.replaceWith(node || (node = create()));
    }
    else if (node) {
      node.replaceWith(anchor);
    }
  });

  return condition() ? (node! || (node = create())) : anchor;
}

export function setAttribute(node: Element, attr: string, value: unknown) {
  node.setAttribute(attr, value as string);
}

export function trackAttribute(node: Element, attr: string, value: () => unknown) {
  watch(() => node.setAttribute(attr, value() as string));
}

type ToString = { toString(): string };
export function trackCssProperty(target: HTMLElement, rule: string, value: (() => ToString) | ToString) {
  if (typeof value === "function") {
    watch(() => target.style.setProperty(rule, value()));
  }
  else {
    target.style.setProperty(rule, value.toString());
  }
}

export function insertChild(
  anchor: Comment | HTMLSlotElement,
  child: Node | (() => { toString(): string }) | number | string | unknown[],
) {
  if (anchor instanceof HTMLSlotElement && !child) {
    anchor.replaceWith(...anchor.children);
    return anchor.children;
  }
  else if (typeof child === "string" || typeof child === "number") {
    const textNode = document.createTextNode("");
    textNode.textContent = child.toString();
    anchor.replaceWith(textNode);
    return textNode;
  }
  else if (child instanceof Node) {
    anchor.replaceWith(child);
    return child;
  }
  else if (child instanceof Array) {
    let next = anchor;
    let a = anchor;
    for (let i = 0; i < child.length; i++) {
      if (i + 1 < child.length) {
        next = document.createComment("");
        a.after(next);
      }
      insertChild(a, child[i] as Node);
      a = next;
    }
    return child;
  }
  else {
    const textNode = document.createTextNode("");
    anchor.replaceWith(textNode);
    watch(() => {
      const c = child();
      if (typeof c === "string") {
        textNode.textContent = c;
      }
      else {
        textNode.textContent = c.toString();
      }
    });
    return textNode;
  }
}

export function createTransition(
  anchor: Comment,
  create: () => Element,
  cond: () => boolean,
  name = "jsx",
) {
  const enterActive = () => `${name}-enter-active`;
  const enterFrom = () => `${name}-enter-from`;
  const enterTo = () => `${name}-enter-to`;

  const leaveActive = () => `${name}-leave-active`;
  const leaveFrom = () => `${name}-leave-from`;
  const leaveTo = () => `${name}-leave-to`;

  function nextFrame() {
    return new Promise(res => {
      requestAnimationFrame(() => requestAnimationFrame(res));
    });
  }

  let t: Element;
  const target = () => (t || (t = create()));
  watch(async () => {
    if (target().classList.length) {
      if (!cond() && (
        target().classList.contains(enterFrom()) ||
        target().classList.contains(enterActive()) ||
        target().classList.contains(enterTo())
      )) {
        await nextFrame();
        removeClasses();
        target().replaceWith(anchor);
      }
      else if (cond() && (
        target().classList.contains(leaveFrom()) ||
        target().classList.contains(leaveTo()) ||
        target().classList.contains(leaveActive())
      )) {
        await nextFrame();
        removeClasses();
        target().replaceWith(anchor);
      }
    }

    if (cond()) {
      if (target().isConnected) { return }
      target().classList.add(enterFrom());
      target().classList.add(enterActive());

      anchor.replaceWith(target());
      await nextFrame();

      target().classList.remove(enterFrom());
      target().classList.add(enterTo());
    }
    else if (target().isConnected) {
      target().classList.add(leaveFrom());
      target().classList.add(leaveActive());

      await nextFrame();

      target().classList.remove(leaveFrom());
      target().classList.add(leaveTo());
    }
  });

  function removeClasses() {
    target().classList.remove(enterActive());
    target().classList.remove(enterFrom());
    target().classList.remove(enterTo());

    target().classList.remove(leaveActive());
    target().classList.remove(leaveFrom());
    target().classList.remove(leaveTo());
  }

  target().addEventListener("transitionend", () => {
    removeClasses();

    if (!cond()) {
      target().replaceWith(anchor);
    }
  });

  return cond() ? target() : anchor;
}
