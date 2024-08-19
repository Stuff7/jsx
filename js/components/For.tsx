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
  let mountList: [T, ReactiveNode][] = [];

  queueMicrotask(() => {
    if (!anchor.isConnected) {
      console.warn("<For> Anchor is not mounted");
      return;
    }

    if (isRangeSet) { return }

    mountList = props.each.map((item, i): [T, ReactiveNode] => {
      const data = reactive(item);
      props.each[i] = data;
      return [data, createNode(data, i)];
    });
    const mounted = mountList.map(([_, n]) => n.elems).flat();

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
    const oldIdx = mountList.findIndex(([v]) => v === val);
    if (oldIdx !== -1) { return [mountList[oldIdx][1], oldIdx] }

    return [createNode(props.each[idx], idx), oldIdx];
  }

  watchOnly([props.each], (key, val) => {
    if (!key) { return }

    if (!isRangeSet) {
      return;
    }

    if (key === "length") {
      if (typeof val !== "number") { return }

      if (val >= mountList.length) { return }

      if (val === 0) {
        isRangeSet = true;
        mountList[0][1].elems[0].replaceWith(anchor);
        range.setStartAfter(anchor);
        anchor.remove();
      }

      for (let i = mountList.length - 1; i >= val; i--) {
        mountList[i][1].elems.forEach(node => node.remove());
      }

      mountList.length = val;
    }
    else {
      const idx = Number(key);

      if (isNaN(idx)) { return }

      const [node, oldIdx] = findNode(idx, val as T);

      if (idx === oldIdx) { return }
      const item = props.each[idx];

      if (idx === mountList.length) {
        const j = mountList.findIndex(([_, n]) => n === node);

        if (j !== -1) {
          mountList[j][1] = {
            idx: ref(j),
            elems: node.elems.map(n => {
              const tmp = document.createElement("slot");
              n.replaceWith(tmp);
              return tmp;
            }),
          };
          mountList[j][0] = { ...mountList[j][0] };
          range.setStartAfter(arrLast(mountList[j][1].elems));
        }

        mountList.push([item, node]);

        reverseForEach(node.elems, node => range.insertNode(node));
        mountList[idx][1].idx.value = idx;
      }
      else if (idx > mountList.length) {
        throw new Error(`<For> Index "${idx}" is out of bounds for children length "${mountList.length}"`);
      }
      else {
        const currNode = mountList[idx][1].elems;

        if (oldIdx !== -1) {
          swapNodes(currNode, node.elems);
          swap(mountList, idx, oldIdx);
          mountList[oldIdx][1].idx.value = oldIdx;
        }
        else {
          currNode.forEach(n => {
            n.replaceWith(...node.elems);
          });
          mountList[idx] = [item, node];
        }
        mountList[idx][1].idx.value = idx;
      }
    }

    if (!mountList.length) { return }

    let node: HTMLElement | HTMLElement[] = mountList[mountList.length - 1][1].elems;
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
