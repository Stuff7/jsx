import { watch } from "~/signals";

type PortalProps = {
  to?: Element | string,
  $ref?: Element | null,
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

  watch(() => {
    parent().append(...slots.default);
  });

  return [] as unknown as JSX.Element;
}
