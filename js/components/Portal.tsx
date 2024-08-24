import { watch } from "~/signals";

type PortalProps = {
  to?: Element | string,
  $ref?: (v: Element) => void,
};

export default function Portal(props: PortalProps, slots: JSX.Slots) {
  const parent = () => {
    let el: Element;
    if (!props.to) {
      el = document.body;
    }
    else if (props.to instanceof Element) {
      el = props.to;
    }
    else {
      el = document.querySelector(props.to) || document.body;
    }

    props.$ref?.(el);
    return el;
  };

  watch(() => {
    parent().append(...slots.default);
  });

  return [] as unknown as JSX.Element;
}
