import jsx, { Fragment, computed } from "~/jsx";

type TransitionProps = {
  name?: string,
};

export default function Transition(props: TransitionProps, ...children: JSX.Children[]): JSX.Element {
  const elem = children[0];

  if (children.length !== 1 || !(elem instanceof HTMLElement)) {
    console.warn("<Transition> must have a single element as children");
    return <>{children}</>;
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

  let willUnmount = false;
  const range = document.createRange();
  elem.addEventListener("mount", async () => {
    if (willUnmount || !document.contains(elem)) { return }

    range.setStartAfter(elem);

    elem.classList.add(enterActive.value);
    elem.classList.add(enterFrom.value);
    await nextFrame();
    elem.classList.remove(enterFrom.value);
    elem.classList.add(enterTo.value);
  });

  elem.addEventListener("unmount", async () => {
    if (willUnmount || document.contains(elem)) {
      willUnmount = false;
      return;
    }

    willUnmount = true;
    range.insertNode(elem);

    elem.classList.add(leaveActive.value);
    elem.classList.add(leaveFrom.value);
    await nextFrame();
    elem.classList.remove(leaveFrom.value);
    elem.classList.add(leaveTo.value);
  });

  elem.addEventListener("transitionend", () => {
    elem.classList.remove(enterActive.value);
    elem.classList.remove(enterFrom.value);
    elem.classList.remove(enterTo.value);

    elem.classList.remove(leaveActive.value);
    elem.classList.remove(leaveFrom.value);
    elem.classList.remove(leaveTo.value);

    if (willUnmount) { elem.remove() }
  });

  return elem;
}
