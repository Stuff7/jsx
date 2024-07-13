import { Reactive, Ref, reactive, ref, watch } from "~/signals";
import { reverseForEach, swap } from "~/utils";

type ForProps<T extends object> = {
  each: Reactive<T[]>,
  do: (item: T, i: Ref<number>) => JSX.Element,
};

type ReactiveNode = { idx: Ref<number>, elems: HTMLElement[] };

export default function For<T extends object>(props: ForProps<T>): JSX.Element {
  const range = document.createRange();
  const nodes = props.each.map(createNode);
  const anchor = document.createComment("For");

  let isRangeSet = false;
  let oldList = [...props.each];

  queueMicrotask(() => {
    if (!anchor.isConnected) {
      console.warn("<For> Anchor is not mounted");
      return;
    }

    if (isRangeSet) { return }

    const mounted = nodes.map(n => n.elems).flat();

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
    const idx = ref(i);
    const data = reactive(val);
    const node = props.do(data, idx);

    watch(() => props.each[idx.value] = val, [data]);

    if (node instanceof Array) { return { idx, elems: node } }
    return { idx, elems: [node] };
  }

  function findNode(idx: number, val: T): [ReactiveNode, number] {
    const oldIdx = oldList.indexOf(val);
    if (oldIdx !== -1) { return [nodes[oldIdx], oldIdx] }

    return [createNode(props.each[idx], idx), oldIdx];
  }

  watch((key, val) => {
    if (!key) { return }

    if (!isRangeSet) {
      return;
    }

    if (key === "length") {
      if (typeof val !== "number") { return }

      if (val >= nodes.length) { return }

      if (val === 0) {
        isRangeSet = true;
        nodes[0].elems[0].replaceWith(anchor);
        range.setStartAfter(anchor);
        anchor.remove();
      }

      for (let i = nodes.length - 1; i >= val; i--) {
        nodes[i].elems.forEach(node => node.remove());
      }

      nodes.length = val;
    }
    else {
      const idx = Number(key);

      if (isNaN(idx)) { return }

      const [node, oldIdx] = findNode(idx, val as T);

      if (idx === oldIdx) { return }

      if (idx === nodes.length) {
        nodes.push(node);
        reverseForEach(node.elems, node => range.insertNode(node));
      }
      else if (idx > nodes.length) {
        throw new Error(`<For> Index "${idx}" is out of bounds for children length "${nodes.length}"`);
      }
      else {
        const currNode = nodes[idx].elems;

        currNode.forEach(n => {
          n.replaceWith(...node.elems);
        });

        if (oldIdx !== -1) {
          swap(nodes, idx, oldIdx);
        }
        else {
          nodes[idx] = node;
        }
        nodes[idx].idx.value = idx;
      }
    }

    if (!nodes.length) { return }

    let node: HTMLElement | HTMLElement[] = nodes[nodes.length - 1].elems;
    node = node[node.length - 1];

    if (!document.contains(node)) { return }

    range.setStartAfter(node);
  }, [props.each]);

  watch(() => oldList = [...props.each]);

  return anchor as unknown as JSX.Element;
}
