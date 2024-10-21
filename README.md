# JSX

JSX is a lightweight library that harnesses TypeScript's `jsxFactory` compiler option to enhance reactivity in TypeScript applications. It extends the default TypeScript compiler output, enabling props as getters and transforming children into functions to create dynamic and responsive elements.

## Build

1. **Build binaries required to build the project**

  ```console
  cargo build --release
  ```

2. **Install npm dependencies**

  ```console
  npm install
  ```

3. **Build the project**

  ```console
  npm run build
  ```

4. **Pack it**

  ```console
  npm run pack
  ```

## Install

  ```console
  npm install path/to/dist/jsx-x.x.x.tgz
  ```

## Usage

1. **Configure TypeScript Compiler**

  Import JSX types in your `tsconfig.json` to enable JSX syntax and typings:

  ```json
  {
    "extends": "jsx/tsconfig.json"
  }
  ```

2. **Integrate JSX in Your Application**

  ```tsx
  // index.tsx
  import { ref } from "jsx";
  import For from "jsx/components/For";

  const [todos, setTodos] = ref<string[]>([]);
  let todoInput!: HTMLInputElement;

  document.body.append(
    <div>
      <input type="text" $ref={todoInput} />
      <button on:click={() => setTodos.byRef(todos => todos.push(todoInput.value))}>
        Add Todo
      </button>
      <h3>You have {todos.length} things to do</h3>
      <ul>
        <For each={todos()} do={(todo, index) => (
          <li>
            {todo()}
            <button on:click={() => setTodos.byRef(todos => todos.splice(index, 1))}>
              Remove
            </button>
          </li>
        )} />
      </ul>
    </div>,
  );
  ```

4. **Run JSX Parser**

  Finally, execute `jsx` on the directory containing your source files, this will replace all the jsx with regular js.

  ```console
  jsx js/sample -outdir build
  ```

5. **Build Your Project**

  Use any tool you like on the built files for further bundling, minification, etc. For example, using `esbuild`:

  ```console
  esbuild build/index.tsx --bundle --sourcemap --minify --outdir=sample
  ```
## Guide

  - JSX syntax returns plain HTML elements:

  ```tsx
  document.body.append(
    <p>
      You can append <strong>JSX</strong> directly here 
      as it returns a regular HTMLElement 
      <em>No need to create a function</em>
    </p>
  );
  ```

  - You can make these elements reactive by using functions such as `reactive` and `ref`

  ```tsx
  const [seconds, setSeconds] = ref(0);
  setInterval(() => setSeconds(seconds() + 1), 1e3);

  document.body.append(<p>You've been here {seconds()} second{seconds() === 1 ? "" : "s"}</p>);
  ```

  - Add events using `on:`:

  ```tsx
  const [count, setCount] = ref(0);

  document.body.append(
    <button on:click={() => setCount(count() + 1)}>Increase</button>,
    <h1>{count()}</h1>,
  );
  ```

  - Add events to window or document using `g:on`:

  ```tsx
  const [pos, setPos] = ref({ x: 0, y: 0 });

  document.body.append(
    <h1 g:onmousemove={e => setPos({ x: e.clientX, y: e.clientY })}>x: {pos().x} y: {pos().y}</h1>,
  );
  ```

  - Add classes using `class:`:

  ```tsx
  document.body.append(<h1 class:title>Title</h1>);
  ```

  - Add togglable classes using a boolean value in `class:`:

  ```tsx
  const [isSelected, setIsSelected] = ref(false);
  document.body.append(
    <input type="checkbox" checked={isSelected()} on:change={e => setIsSelected(e.currentTarget.checked)} />,
    <h1 class:selected={isSelected()}>Title</h1>
  );
  ```

  - Get a reference to an element using `$ref`

  ```tsx
  let input!: HTMLInputElement;
  document.body.append(<input class:my-input $ref={input} />);
  console.log(input.className, "was assigned above");
  ```

  - Make attributes reactive by prepending them with `$`:

  ```tsx
  const [maxLimit, setMaxLimit] = ref(0);
  const [value, setValue] = ref(0);

  document.body.append(
    <input value={maxLimit()} on:input={e => setMaxLimit(+e.currentTarget.value)} />,
    <input
      type="range"
      $value={value()}
      $max={maxLimit()}
      on:input={e => setValue(+e.currentTarget.value)}
    />,
    <h1>{value()}</h1>,
  );
  ```

  - Do conditional rendering using `$if`

  ```tsx
  const [greet, setGreet] = ref(false);

  document.body.append(
    <input type="checkbox" checked={greet()} on:change={e => setGreet(e.currentTarget.checked)} />,
    <p $if={greet()}>Hello!</p>
  );
  ```

  - Create mount/unmount transitions using `$transition`

  ```tsx
  const [greet, setGreet] = ref(false);

  document.body.append(
    <input type="checkbox" checked={greet()} on:change={e => setGreet(e.currentTarget.checked)} />,
    <p $transition:slide={greet()}>Hello!</p>
  );

  document.head.append(
    <style>{`
      p {
        transition: margin-top 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s;
      }

      p.slide-enter-active, p.slide-leave-active {
        margin-top: 0;
        opacity: 1;
      }

      p.slide-enter-from, p.slide-leave-to {
        margin-top: -50px;
        opacity: 0;
      }
    `}</style>
  );
  ```

  The following CSS classes are applied, with `jsx` replaced by the value specified after the colon in `$transition:name-here`:

  - `jsx-enter-from`: The initial state for entering. This class is applied before the element is inserted and removed one frame after it is inserted.

  - `jsx-enter-active`: The active state for entering. This class is applied throughout the entire entering phase. It is added before the element is inserted and removed once the transition or animation completes. You can use this class to define the duration, delay, and easing curve for the entering transition.

  - `jsx-enter-to`: The final state for entering. This class is applied one frame after the element is inserted (simultaneously with the removal of `v-enter-from`), and removed once the transition or animation finishes.

  - `jsx-leave-from`: The initial state for leaving. This class is applied immediately when a leaving transition starts and removed after one frame.

  - `jsx-leave-active`: The active state for leaving. This class is applied during the entire leaving phase. It is added immediately when a leaving transition begins and removed when the transition or animation finishes. This class can be used to define the duration, delay, and easing curve for the leaving transition.

  - `jsx-leave-to`: The final state for leaving. This class is applied one frame after the leaving transition starts (simultaneously with the removal of `v-leave-from`) and removed when the transition or animation completes.
