import jsx, { Fragment } from "~/jsx";
import { watch } from "~/signals";

type PortalProps = {
  to?: Element,
};

export default function Portal(props: PortalProps, ...children: HTMLElement[]) {
  queueMicrotask(() => {
    watch(() => {
      children.forEach(n => n.remove());

      if (props.to) {
        props.to.append(...children);
      }
      else {
        document.body.append(...children);
      }
    });
  });

  return <></>;
}
