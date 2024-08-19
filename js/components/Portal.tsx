import { computed, watch } from "~/signals";

type PortalProps = {
  to?: Element | string,
};

export default function Portal(props: PortalProps, ...children: HTMLElement[]) {
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
    parent.value.append(...children);
  });

  return [] as unknown as JSX.Element;
}
