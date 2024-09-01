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

  elem.addEventListener("mount", () => {
    if (anchor.isPositioned()) {
      return;
    }

    anchor.setFromElement(elem);
    if (!props.$if) {
      elem.remove();
    }
  }, { once: true });

  watch(async () => {
    if (elem.classList.length) {
      if (!props.$if && (
        elem.classList.contains(enterFrom()) ||
        elem.classList.contains(enterActive()) ||
        elem.classList.contains(enterTo())
      )) {
        await nextFrame();
        removeClasses();
        elem.remove();
      }
      else if (props.$if && (
        elem.classList.contains(leaveFrom()) ||
        elem.classList.contains(leaveTo()) ||
        elem.classList.contains(leaveActive())
      )) {
        await nextFrame();
        removeClasses();
        elem.remove();
      }
    }

    if (props.$if) {
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
