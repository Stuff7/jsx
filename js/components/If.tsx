import { computed, watch } from "~/jsx";

type IfProps = {
  cond: boolean,
  fallback?: JSX.Element,
};

export default function If(props: IfProps, children: JSX.Element): JSX.Element {
  const fallback = computed(() => props.fallback || document.createElement("slot"));
  let ret = props.cond ? children : fallback.value;

  function replaceWith(element: Element, nodes: JSX.Element) {
    if (Array.isArray(nodes)) {
      element.replaceWith(...nodes);
    }
    else {
      element.replaceWith(nodes);
    }
  }

  function updateNode(nodes: JSX.Element) {
    const mountedNodes = ret;
    ret = nodes;

    let mountedElem: Element;
    if (Array.isArray(mountedNodes) && mountedNodes[0] instanceof Element) {
      for (let i = 1; i < mountedNodes.length; i++) {
        mountedNodes[i].remove();
      }

      mountedElem = mountedNodes[0];
    }
    else if (mountedNodes instanceof Element) {
      mountedElem = mountedNodes;
    }
    else {
      console.warn("<If> Unexpected type for mountedNodes", mountedNodes);
      return;
    }

    if (mountedElem === nodes || !document.contains(mountedElem)) { return }

    replaceWith(mountedElem, nodes);
  }

  watch(() => {
    if (props.cond) {
      updateNode(children);
    }
    else {
      updateNode(fallback.value);
    }
  });


  return ret as JSX.Element;
}
