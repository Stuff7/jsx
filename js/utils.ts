export function reverseForEach<T>(arr: T[], cb: (node: T) => boolean | void) {
  arr.findLast(cb);
}

export function swap<T>(arr: T[], idx1: number, idx2: number) {
  [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
}

export function arrLast<T>(arr: T[]): T {
  return arr[arr.length - 1];
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
