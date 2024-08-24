import { ref, watch } from "~/signals";
import { deepEq } from "~/utils";

type ForProps<T extends object> = {
  each: T[],
  do: (item: () => T, i: number) => JSX.Element,
};

/**
 * A component that renders a list of JSX elements from a fixed-size array of reactive items.
 *
 * This component takes a fixed-size array of objects and a render function, converts each object
 * in the array into a reactive object, and then uses the render function to generate
 * JSX elements for each item.
 *
 * @note If you need to render a dynamically-sized array use <For> instead.
 */
export default function FixedFor<T extends object>(props: ForProps<T>): JSX.Element {
  return props.each.map((_, i) => {
    const [item, setItem] = ref(props.each[i]);

    return props.do(item, i);
  }) as unknown as JSX.Element;
}
