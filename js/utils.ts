export function reverseForEach<T>(arr: T[], cb: (node: T) => boolean | void) {
  arr.findLast(cb);
}

export function swapRemove<T>(a: T[], i: number) {
  a[i] = a[a.length - 1];
  a.length--;
}

export function swap<T>(arr: T[], idx1: number, idx2: number) {
  [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
}

export function arrLast<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

export function deepEq<A extends object, B extends object>(a: A | B, b: B | A): boolean {
  const keys1 = Object.keys(a);
  const keys2 = Object.keys(b);

  const allKeys = new Set([...keys1, ...keys2]);

  for (const key of allKeys) {
    const aV = a[key];
    const bV = b[key];

    if (typeof aV === "object" && typeof bV === "object") {
      if (aV instanceof Date && bV instanceof Date) {
        if (aV.getTime() !== bV.getTime()) {
          return false;
        }
      }
      else if (aV instanceof Map && bV instanceof Map) {
        if (aV.size !== bV.size) {
          return false;
        }

        for (const [key, value] of aV) {
          if (!bV.has(key) || bV.get(key) !== value) {
            return false;
          }
        }
      }
      else if (aV instanceof Set && bV instanceof Set) {
        if (aV.size !== bV.size) {
          return false;
        }

        for (const item of aV) {
          if (!bV.has(item)) {
            return false;
          }
        }
      }
      else if (!deepEq(aV, bV)) {
        return false;
      }
    }
    else if (aV !== bV) {
      return false;
    }
  }

  return true;
}

export function iterChildrenDeep<T extends Node>(node: T, fn: (node: T) => void) {
  if (node.nodeType === node.ELEMENT_NODE) {
    for (const c of (node as unknown as Element).getElementsByTagName("*")) {
      fn(c as unknown as T);
    }
  }

  fn(node);
}

export function iterChildNodesDeep(node: Node, fn: (node: ChildNode) => void) {
  fn(node as ChildNode);
  for (const n of node.childNodes) {
    iterChildNodesDeep(n, fn);
  }
  (node as ChildNode).remove();
}

export type ElementPosition = {
  parent: HTMLElement | null,
  prevSibling: ChildNode | null,
  nextSibling: ChildNode | null,
  setFromElement<T extends Node>(element: T): void,
  isPositioned(): boolean,
  getInsertFunction(): InsertNodeFn,
  insertNode(...nodes: Parameters<InsertNodeFn>): boolean,
};

export type InsertNodeFn = ChildNode["after"];

export function createElementPosition<T extends Node>(elem?: T): ElementPosition {
  const self: ElementPosition = {
    parent: null,
    prevSibling: null,
    nextSibling: null,
    setFromElement(element) {
      this.parent = element.parentElement;
      this.prevSibling = element.previousSibling;
      this.nextSibling = element.nextSibling;
    },
    isPositioned() {
      return !!(this.parent || this.prevSibling || this.nextSibling);
    },
    getInsertFunction() {
      if (this.prevSibling && this.prevSibling.parentElement) {
        return this.prevSibling.after.bind(this.prevSibling);
      }
      if (this.nextSibling && this.nextSibling.parentElement) {
        return this.nextSibling.before.bind(this.nextSibling);
      }
      if (this.parent) {
        if (this.nextSibling) {
          return this.parent.prepend.bind(this.parent);
        }
        return this.parent.append.bind(this.parent);
      }
      throw new Error("Could not find element position");
    },
    insertNode(...nodes) {
      try {
        this.getInsertFunction()(...nodes);
        return true;
      }
      catch (_) {
        return false;
      }
    },
  };

  if (elem) {
    queueMicrotask(() => self.setFromElement(elem));
  }

  return self;
}
