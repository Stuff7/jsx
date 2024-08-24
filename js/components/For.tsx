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
    if (!anchor.isConnected) {
      console.warn("<For> failed to mount");
    }
    initialPosition.setFromElement(anchor);
    anchor.remove();
    list.forEach(n => initialPosition.insertNode(n));
  });

  function createNode(_: T, i: number) {
    const [item, setItem] = ref(props.each[i]);

    const currentItem = item();
    if (currentItem && typeof currentItem === "object" && !isReactiveObject(currentItem)) {
      reactive(currentItem);
    }

    let removed = false;
    watch(() => {
      if (removed) { return }

      const newItem = props.each[i];
      if (newItem && typeof newItem === "object" && !isReactiveObject(newItem)) {
        reactive(newItem);
      }

      if (item() !== newItem) {
        if (newItem === undefined) {
          list[i].remove();
          length = refs.length = list.length = props.each.length;
          removed = true;
        }
        else {
          setItem(newItem);
        }
      }
    });

    refs.push(item());

    return props.do(item, i);
  }

  watch(() => {
    if (props.each.length > length) {
      const lastElem = list[length - 1];

      let insertNode: InsertNodeFn;
      if (lastElem) {
        insertNode = lastElem.after.bind(lastElem);
      }
      else {
        insertNode = initialPosition.getInsertFunction();
      }

      for (let i = length; i < props.each.length; i++) {
        const node = createNode(props.each[i], i);
        insertNode(node);
        list.push(node);
      }
    }

    length = refs.length;
  });

  return anchor as unknown as JSX.Element;
}
