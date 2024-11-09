import { destroyNode } from "~/jsx";
import { isReactiveObject, reactive, ref, watch } from "~/signals";
import { createElementPosition, InsertNodeFn } from "~/utils";

type ForProps<T> = {
  each: T[],
  do: (item: () => T, i: number) => JSX.Element,
};

/**
 * A component that renders a list of JSX elements from a reactive dynamically-sized array.
 * Elements are keyed by reference, meaning nodes will only be re-created when the actual
 * object in the array changes.
 *
 * @note Use `<FixedFor>` if you need to render a fixed-size array, as this component is
 * optimized for dynamic arrays that can change in size.
 */
export default function For<T>(props: ForProps<T>): JSX.Element {
  const initialPosition = createElementPosition();
  const anchor = document.createComment("For");

  const refs: T[] = [];
  const list = props.each.map(createNode);
  let length = props.each.length;

  queueMicrotask(() => {
    if (!anchor.isConnected && !anchor.parentElement) {
      console.warn("<For> failed to mount");
    }
    initialPosition.setFromElement(anchor);
    anchor.remove();
    list.forEach((n, i) => {
      const lastElem = list[i - 1];
      let insertNode: InsertNodeFn;

      if (lastElem?.isConnected) {
        insertNode = lastElem.after.bind(lastElem);
      }
      else {
        insertNode = initialPosition.getInsertFunction();
      }

      return insertNode(n);
    });
  });

  function createNode(data: T, i: number) {
    const [item, setItem] = ref(data);

    const currentItem = item();
    if (currentItem && typeof currentItem === "object") {
      if (isReactiveObject(currentItem)) {
        currentItem.listeners.clear();
      }
      else {
        reactive(currentItem);
      }
    }

    let removed = false;
    watch(() => {
      if (removed) { return }

      const newItem = props.each[i];
      if (newItem && typeof newItem === "object" && !isReactiveObject(newItem)) {
        reactive(newItem);
      }

      if (item() !== newItem) {
        refs[i] = newItem;
        if (newItem === undefined) {
          removed = true;
          removeNode();
        }
        else {
          setItem(newItem);
        }
      }
    });

    refs.push(item());

    return props.do(item, i);
  }

  function removeNode() {
    if (props.each.length < length) {
      if (refs[length - 1] !== undefined) { return }
      for (let i = length - 1; i >= props.each.length; i--) {
        destroyNode(list[i]);
      }
      length = refs.length = list.length = props.each.length;
    }
  }

  watch(() => {
    if (props.each.length > length) {
      for (let i = length; i < props.each.length; i++) {
        const lastElem = list[i - 1];

        let insertNode: InsertNodeFn;
        if (lastElem?.isConnected) {
          insertNode = lastElem.after.bind(lastElem);
        }
        else {
          insertNode = initialPosition.getInsertFunction();
        }

        const node = createNode(props.each[i], i);
        insertNode(node);
        list.push(node);
      }

      length = refs.length = list.length = props.each.length;
    }
    else if (props.each.length < length) {
      removeNode();
    }
  });

  return anchor as unknown as JSX.Element;
}
