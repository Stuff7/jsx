import { Reactive, Ref, reactive, ref, watchOnly, isReactive } from "~/signals";
import { reverseForEach, swap, arrLast } from "~/utils";

type ForProps<T extends object> = {
  each: Reactive<T[]>,
  do: (item: T, i: Ref<number>) => JSX.Element,
};

type ReactiveNode = { idx: Ref<number>, elems: HTMLElement[] };

/**
 * A component that renders a list of JSX elements from a reactive dynamically-sized array.
 * Elements are keyed by reference, meaning nodes will only be re-created when the actual
 * object in the array changes.
 *
 * @note Use `<FixedFor>` if you need to render a fixed-size array, as this component is
 * optimized for dynamic arrays that can change in size.
 */
export default function For<T extends object>(props: ForProps<T>): JSX.Element {
  const range = document.createRange();
  const anchor = document.createComment("For");

  let isRangeSet = false;
  const oldList = props.each.map((item, i): [T, ReactiveNode] => {
    const data = reactive(item);
    props.each[i] = data;
    return [data, createNode(data, i)];
  });

  queueMicrotask(() => {
    if (!anchor.isConnected) {
      console.warn("<For> Anchor is not mounted");
      return;
    }

    if (isRangeSet) { return }

    const mounted = oldList.map(([_, n]) => n.elems).flat();

    if (mounted.length) {
      anchor.replaceWith(...mounted);
      range.setStartAfter(mounted[mounted.length - 1]);
    }
    else {
      range.setStartAfter(anchor);
      anchor.remove();
    }

    isRangeSet = true;
  });

  function createNode(val: T, i: number): ReactiveNode {
    const isValReactive = isReactive(val);
    const idx = ref(i);
    const data = isValReactive ? val : reactive(val);
    if (!isValReactive) {
      props.each[idx.value] = data;
    }
    const node = props.do(data, idx);

    if (node instanceof Array) { return { idx, elems: node } }
    return { idx, elems: [node] };
  }

  function findNode(idx: number, val: T): [ReactiveNode, number] {
    const oldIdx = oldList.findIndex(([v]) => v === val);
    if (oldIdx !== -1) { return [oldList[oldIdx][1], oldIdx] }

    return [createNode(props.each[idx], idx), oldIdx];
  }

  watchOnly([props.each], (key, val) => {
    if (!key) { return }

    if (!isRangeSet) {
      return;
    }

    if (key === "length") {
      if (typeof val !== "number") { return }

      if (val >= oldList.length) { return }

      if (val === 0) {
        isRangeSet = true;
        oldList[0][1].elems[0].replaceWith(anchor);
        range.setStartAfter(anchor);
        anchor.remove();
      }

      for (let i = oldList.length - 1; i >= val; i--) {
        oldList[i][1].elems.forEach(node => node.remove());
      }

      oldList.length = val;
    }
    else {
      const idx = Number(key);

      if (isNaN(idx)) { return }

      const [node, oldIdx] = findNode(idx, val as T);

      if (idx === oldIdx) { return }
      const item = props.each[idx];

      if (idx === oldList.length) {
        const j = oldList.findIndex(([_, n]) => n === node);

        if (j !== -1) {
          oldList[j][1] = {
            idx: ref(j),
            elems: node.elems.map(n => {
              const tmp = document.createElement("slot");
              tmp.innerText = "tmp";
              n.replaceWith(tmp);
              return tmp;
            }),
          };
          oldList[j][0] = { ...oldList[j][0] };
          range.setStartAfter(arrLast(oldList[j][1].elems));
        }

        oldList.push([item, node]);

        reverseForEach(node.elems, node => range.insertNode(node));
        oldList[idx][1].idx.value = idx;
      }
      else if (idx > oldList.length) {
        throw new Error(`<For> Index "${idx}" is out of bounds for children length "${oldList.length}"`);
      }
      else {
        const currNode = oldList[idx][1].elems;

        if (oldIdx !== -1) {
          swapNodes(currNode, node.elems);
          swap(oldList, idx, oldIdx);
          oldList[oldIdx][1].idx.value = oldIdx;
        }
        else {
          currNode.forEach(n => {
            n.replaceWith(...node.elems);
          });
          oldList[idx] = [item, node];
        }
        oldList[idx][1].idx.value = idx;
      }
    }

    if (!oldList.length) { return }

    let node: HTMLElement | HTMLElement[] = oldList[oldList.length - 1][1].elems;
    node = node[node.length - 1];

    if (!document.contains(node)) { return }

    range.setStartAfter(node);
  });

  return anchor as unknown as JSX.Element;
}

function swapNodes(a: HTMLElement[], b: HTMLElement[]) {
  const temp = b.map(n => {
    const temp = document.createComment("");
    n.replaceWith(temp);
    return temp;
  });
  a.forEach(n => n.replaceWith(...b));
  temp.forEach(n => n.replaceWith(...a));
}
