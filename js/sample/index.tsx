import jsx, { reactive, ref } from "~/jsx";
import For from "~/components/For";

type Todo = { text: string };

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
  </div>,
);
