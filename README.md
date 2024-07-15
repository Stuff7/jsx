# JSX

JSX is a lightweight library that harnesses TypeScript's `jsxFactory` compiler option to enhance reactivity in TypeScript applications. It extends the default TypeScript compiler output, enabling props as getters and transforming children into functions to create dynamic and responsive elements.

## Build

1. **Build binaries required to build the project**

   ```sh
   cargo build --release
   ```

2. **Install npm dependencies**

   ```sh
   npm install
   ```

3. **Build the project**

   ```sh
   npm run build
   ```

4. **Pack it**

   ```sh
   npm run pack
   ```

## Install

   ```sh
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

   JSX syntax returns plain HTML elements and you can make these elements reactive by using functions such as `reactive` and `ref`:

   ```tsx
   // index.tsx
   import jsx, { reactive, ref } from "jsx";
   import For from "jsx/components/For";

   // The component `For` requires array elements to be objects for referential keying. Hence, we use `Todo[]` instead of simply `string[]`.
   type Todo = { text: string };

   // Using `reactive` with an array instead of `ref` enables reactivity for array mutation methods applied to `todos`.
   const todos = reactive<Todo[]>([]);
   const newTodo = ref("");

   document.body.append(
     <div>
       <input bind:value={newTodo} type="text" />
       <button on:click={() => todos.push({ text: newTodo.value })}>
         Add Todo
       </button>
       <h3>You have {todos.length} things to do</h3>
       <ul>
         <For each={todos} do={(todo, index) => (
           <li>
             {todo.text}
             <button on:click={() => todos.splice(index.value, 1)}>
               Remove
             </button>
           </li>
         )} />
       </ul>
     </div>
   );
   ```

3. **Build Your Project**

   Use any bundler that supports transforming JSX similarly to TypeScript's `tsc` output. For example, using `esbuild`:

   ```sh
   esbuild index.tsx --bundle --sourcemap --jsx=automatic --outdir=sample
   ```

4. **Run JSX Engine**

   Finally, execute `jsx` on the directory containing your built files, this step is necessary for the reactive system to work correctly.

   ```sh
   jsx sample
   ```
