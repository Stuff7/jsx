import { computed, watch } from "~/signals";

type PortalProps = {
  to?: Element | string,
};

export default function Portal(props: PortalProps, slots: JSX.Slots) {
  const parent = computed(() => {
    if (!props.to) {
      return document.body;
    }
    if (props.to instanceof Element) {
      return props.to;
    }
    return document.querySelector(props.to) || document.body;
  });

  watch(() => {
    parent.value.append(...slots.default);
  });

  return [] as unknown as JSX.Element;
}
