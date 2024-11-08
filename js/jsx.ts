import { cleanup, Running, watch, watchFn } from "~/signals";
import { EventName } from "./dom-utils";
import { swapRemove, iterChildrenDeep, iterChildNodesDeep } from "./utils";

export * from "~/signals";

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

type GlobalEvent = {
  fn: EventHandler,
  target: Element,
  once?: boolean,
};

export function createGlobalEvent(evName: EventName) {
  const listeners = [] as GlobalEvent[];

  (evName === "resize" ? window : document).addEventListener(evName, (e) => {
    for (let i = listeners.length - 1; i >= 0; i--) {
      const l = listeners[i];
      if (!l.target.isConnected) { continue }
      l.fn(e);
      if (l.once) {
        swapRemove(listeners, i);
      }
    }
  });

  return listeners;
}

export function destroyNode(node: Element) {
  iterChildNodesDeep(node, t => t.dispatchEvent(new CustomEvent("destroy")));
}

export function observeTree(observer: MutationObserver, target: Element, isMount: boolean) {
  queueMicrotask(() => {
    if (!target.parentNode) { return }
    observer.observe(target.parentNode, { childList: true, subtree: true });
    if (isMount) {
      target.dispatchEvent(new CustomEvent("mount"));
    }
  });
}

export function createMutationObserver() {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== "childList") { return }

      for (const node of mutation.addedNodes) {
        queueMicrotask(() => {
          iterChildrenDeep(node, node => node.dispatchEvent(new CustomEvent("mount")));
        });
      }
      for (const node of mutation.removedNodes) {
        queueMicrotask(() => {
          iterChildrenDeep(node, node => node.dispatchEvent(new CustomEvent("unmount")));
        });
      }
    });
  });
}

export function addGlobalEvent(
  listeners: GlobalEvent[],
  target: GlobalEvent["target"],
  value: EventHandler | [EventHandler, AddEventListenerOptions],
) {
  let added = false;
  if (value instanceof Array) {
    if (value[0]) {
      listeners.push({ fn: value[0], once: value[1].once, target });
      added = true;
    }
  }
  else if (value) {
    listeners.push({ fn: value, target });
    added = true;
  }

  if (added) {
    target.addEventListener("destroy", () => {
      const i = listeners.findIndex(l => l.target === target);
      if (i !== -1) {
        swapRemove(listeners, i);
      }
    });
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

function applyToNodes(node: Element | Element[], action: (n: Element) => void) {
  if (node instanceof Array) {
    node.forEach(action);
  }
  else {
    action(node);
  }
}

export function conditionalRender(
  anchor: Comment,
  createNode: () => Element | Element[],
  condition: () => boolean,
) {
  let node: Element | Element[];

  anchor.addEventListener("destroy", () => {
    if (node) {
      applyToNodes(node, destroyNode);
    }
    else {
      cleanup(running);
    }
  });
  const create = () => {
    node = createNode();
    applyToNodes(node, n => {
      n.addEventListener("destroy", () => {
        cleanup(running);
        anchor.remove();
      });
    });

    return node;
  };

  const running = watchFn(condition, () => {
    if (condition()) {
      applyToNodes(node || (node = create()), n => anchor.replaceWith(n));
    }
    else if (node) {
      applyToNodes(node, n => n.replaceWith(anchor));
    }
  });

  return condition() ? (node! || (node = create())) : anchor;
}

export function setAttribute(node: Element, attr: string, value: unknown) {
  if (value == null || value === false) {
    node.removeAttribute(attr);
  }
  else {
    node.setAttribute(attr, value as string);
  }
}

export function trackAttribute(node: Element, attr: string, value: () => unknown) {
  let running: Running<unknown>;

  if (attr === "value" || attr === "checked") {
    running = watch(() => {
      node[attr] = value();
    });
  }
  else {
    running = watch(() => {
      setAttribute(node, attr, value());
    });
  }

  node.addEventListener("destroy", () => cleanup(running));
}

export function trackClass(target: Element, className: string, value: () => boolean) {
  const running = watch(() => {
    if (!value()) {
      target.classList.remove(className);
    }
    else {
      target.classList.add(className);
    }
  });

  target.addEventListener("destroy", () => cleanup(running));
}

type ToString = { toString(): string };
export function trackCssProperty(target: HTMLElement, rule: string, value: (() => ToString) | ToString) {
  if (typeof value === "function") {
    const running = watch(() => target.style.setProperty(rule, value()));
    target.addEventListener("destroy", () => cleanup(running));
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
    anchor.replaceWith(...anchor.childNodes);
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
    const running = watch(() => {
      const c = child();
      if (typeof c === "string") {
        textNode.textContent = c;
      }
      else if (c != null) {
        textNode.textContent = c.toString();
      }
      else if (c == null) {
        textNode.textContent = "";
      }
    });
    textNode.addEventListener("destroy", () => cleanup(running));
    return textNode;
  }
}

export function createTransition(
  anchor: Comment,
  createNode: () => Element,
  cond: () => boolean,
  name = "jsx",
) {
  let t: Element;
  anchor.addEventListener("destroy", () => {
    if (t) {
      destroyNode(t);
    }
    else {
      cleanup(running);
    }
  });

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

  const create = () => {
    t = createNode();

    t.addEventListener("destroy", () => {
      cleanup(running);
      anchor.remove();
    });
    t.addEventListener("transitionend", () => {
      removeClasses();

      if (!cond()) {
        t.replaceWith(anchor);
      }
    });

    return t;
  };
  const target = () => (t || (t = create()));
  let firstRun = true;
  const running = watchFn(cond, async () => {
    if (firstRun && !cond()) {
      firstRun = false;
      return;
    }
    firstRun = false;

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

  return cond() ? target() : anchor;
}
