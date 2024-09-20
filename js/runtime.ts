import { watch } from "./signals";

export function template(html: string) {
  const createNode = () => {
    const templ = document.createElement("template");
    templ.innerHTML = html;
    return templ.content.firstChild!;
  };

  let node!: Node;
  return () => (node || (node = createNode())).cloneNode(true);
}

export function watchAttribute(node: Element, attr: string, value: () => unknown) {
  watch(() => node.setAttribute(attr, value() as string));
}

export function insertChild(
  child: Node | (() => { toString(): string }) | number | string,
  anchor: Comment,
) {
  if (typeof child === "string" || typeof child === "number") {
    const textNode = document.createTextNode("");
    textNode.textContent = child.toString();
    anchor.replaceWith(textNode);
    return textNode;
  }
  else if (child instanceof Node) {
    anchor.replaceWith(child);
    return child;
  }
  else {
    const textNode = document.createTextNode("");
    anchor.replaceWith(textNode);
    watch(() => {
      const c = child();
      if (typeof c === "string") {
        textNode.textContent = c;
      }
      else {
        textNode.textContent = c.toString();
      }
    });
    return textNode;
  }
}
