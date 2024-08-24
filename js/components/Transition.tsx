import { watch } from "~/jsx";
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

  const name = () => props.name || "jsx";

  const enterActive = () => `${name()}-enter-active`;
  const enterFrom = () => `${name()}-enter-from`;
  const enterTo = () => `${name()}-enter-to`;

  const leaveActive = () => `${name()}-leave-active`;
  const leaveFrom = () => `${name()}-leave-from`;
  const leaveTo = () => `${name()}-leave-to`;

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
      elem.classList.add(enterFrom());
      elem.classList.add(enterActive());

      anchor.insertNode(elem);
      await nextFrame();

      elem.classList.remove(enterFrom());
      elem.classList.add(enterTo());
    }
    else if (elem.isConnected) {
      elem.classList.add(leaveFrom());
      elem.classList.add(leaveActive());

      await nextFrame();

      elem.classList.remove(leaveFrom());
      elem.classList.add(leaveTo());
    }
  });

  function removeClasses() {
    elem.classList.remove(enterActive());
    elem.classList.remove(enterFrom());
    elem.classList.remove(enterTo());

    elem.classList.remove(leaveActive());
    elem.classList.remove(leaveFrom());
    elem.classList.remove(leaveTo());
  }

  elem.addEventListener("transitionend", () => {
    removeClasses();

    if (!props.$if) {
      elem.remove();
    }
  });

  return elem;
}
