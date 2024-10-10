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

type GlobalEventListeners = {
  fn: (e: Event) => void,
  target: Element,
};

export function createGlobalEvent(evName: EventName) {
  const listeners = [] as GlobalEventListeners[];

  (evName === "resize" ? window : document).addEventListener(evName, (e) => {
    for (const l of listeners) {
      for (const t of iterParents(e.target)) {
        if (t === l.target) {
          l.fn(e);
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
  fn: GlobalEventListeners["fn"],
) {
  listeners.push({ fn, target });
}

export function conditionalRender(parent: Node, anchor: Comment, create: () => Element, condition: () => boolean) {
  let node: Element;

  watch(() => {
    if (condition()) {
      anchor.replaceWith(node || (node = create()));
    }
    else if (node) {
      node.replaceWith(anchor);
    }
  });

  return anchor;
}

export function trackAttribute(node: Element, attr: string, value: () => unknown) {
  watch(() => node.setAttribute(attr, value() as string));
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
