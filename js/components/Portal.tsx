import { watch } from "~/signals";
import { iterChildNodesDeep, iterChildrenDeep } from "~/utils";

type PortalProps = {
  to?: Element | string,
  $ref?: Element,
};

export default function Portal(props: PortalProps, slots: JSX.Slots) {
  const parent = () => {
    if (!props.to) {
      props.$ref = document.body;
    }
    else if (props.to instanceof Element) {
      props.$ref = props.to;
    }
    else {
      props.$ref = document.querySelector(props.to) || document.body;
    }

    return props.$ref;
  };

  const anchor = document.createComment("");

  const children = slots.default?.();
  queueMicrotask(() => {
    anchor.addEventListener("destroy", () => {
      children.forEach(s => iterChildNodesDeep(s, n => n.remove()));
      anchor.remove();
    });
  });

  watch(() => {
    parent().append(...children);
  });

  return anchor as unknown as JSX.Element;
}
