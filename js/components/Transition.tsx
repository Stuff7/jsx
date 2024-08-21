import { computed, watch } from "~/jsx";
import { createElementPosition } from "~/utils";

type TransitionProps = {
  name?: string,
  $if?: boolean,
};

export default function Transition(props: TransitionProps, slots: JSX.Slots): JSX.Element {
  const elem = slots.default[0];

  if (slots.default.length !== 1 || !(elem instanceof HTMLElement)) {
    console.warn("<Transition> must have a single element as children");
    return slots.default as unknown as JSX.Element;
  }

  const name = computed(() => props.name || "jsx");

  const enterActive = computed(() => `${name.value}-enter-active`);
  const enterFrom = computed(() => `${name.value}-enter-from`);
  const enterTo = computed(() => `${name.value}-enter-to`);

  const leaveActive = computed(() => `${name.value}-leave-active`);
  const leaveFrom = computed(() => `${name.value}-leave-from`);
  const leaveTo = computed(() => `${name.value}-leave-to`);

  function nextFrame() {
    return new Promise(res => {
      requestAnimationFrame(() => requestAnimationFrame(res));
    });
  }

  const anchor = createElementPosition();

  function onMount() {
    if (anchor.isPositioned()) {
      return;
    }

    anchor.setFromElement(elem);
    if (!props.$if) {
      elem.remove();
    }

    elem.removeEventListener("mount", onMount);
  }

  elem.addEventListener("mount", onMount);

  watch(async () => {
    if (props.$if) {
      removeClasses();
      if (elem.isConnected) { return }
      elem.classList.add(enterFrom.value);
      elem.classList.add(enterActive.value);

      anchor.insertNode(elem);
      await nextFrame();

      elem.classList.remove(enterFrom.value);
      elem.classList.add(enterTo.value);
    }
    else if (elem.isConnected) {
      elem.classList.add(leaveFrom.value);
      elem.classList.add(leaveActive.value);

      await nextFrame();

      elem.classList.remove(leaveFrom.value);
      elem.classList.add(leaveTo.value);
    }
  });

  function removeClasses() {
    elem.classList.remove(enterActive.value);
    elem.classList.remove(enterFrom.value);
    elem.classList.remove(enterTo.value);

    elem.classList.remove(leaveActive.value);
    elem.classList.remove(leaveFrom.value);
    elem.classList.remove(leaveTo.value);
  }

  elem.addEventListener("transitionend", () => {
    removeClasses();

    if (!props.$if) {
      elem.remove();
    }
  });

  return elem;
}
