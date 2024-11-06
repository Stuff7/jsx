import { ref, watchOnly } from "~/jsx";
import For from "~/components/For";

type Animal = {
  name: string,
  habitat: string,
  isEndangered: boolean,
  count: number
};

const [animals, setAnimals] = ref<Animal[]>([
  { name: "Elephant", habitat: "Savannah", isEndangered: true, count: 0 },
  { name: "Tiger", habitat: "Forest", isEndangered: true, count: 0 },
  { name: "Panda", habitat: "Bamboo Forest", isEndangered: true, count: 0 },
  { name: "Kangaroo", habitat: "Grasslands", isEndangered: false, count: 0 },
  { name: "Dolphin", habitat: "Ocean", isEndangered: true, count: 0 },
  { name: "Penguin", habitat: "Antarctica", isEndangered: false, count: 0 },
  { name: "Giraffe", habitat: "Savannah", isEndangered: false, count: 0 },
  { name: "Lion", habitat: "Savannah", isEndangered: true, count: 0 },
  { name: "Zebra", habitat: "Savannah", isEndangered: false, count: 0 },
  { name: "Koala", habitat: "Eucalyptus Forest", isEndangered: true, count: 0 },
]);

setInterval(() => {
  animals()[0].count++;
}, 2e3);

watchOnly([animals], () => console.log(animals()));

function removeAnimal(i: number) {
  setAnimals.byRef(animals => animals.splice(i, 1));
}

function insertAnimal(i: number) {
  setAnimals.byRef(animals => animals.splice(i + 1, 0, {
    name: "Insert",
    habitat: "NewInsert",
    isEndangered: true,
    count: 0,
  }));
}

function addAnimal() {
  setAnimals.byRef(animals => animals.push({
    name: "Push",
    isEndangered: true,
    count: 0,
    habitat: "NewPush",
  }));
}

const [filtered, setFiltered] = ref([...animals()]);
const [nameFilter, setNameFilter] = ref("");

watchOnly([animals], filterByName);

function filterByName() {
  if (!nameFilter()) {
    setFiltered([...animals()]);
    return;
  }

  setFiltered(animals().filter(a => a.name.includes(nameFilter())));
}

const [index, setIndex] = ref(0);

document.head.append(<style>{style()}</style>);
document.body.append(
  <main>
    <input on:input={e => {
      setNameFilter(e.currentTarget.value);
      filterByName();
    }} />
    <For each={filtered()} do={(animal, i) => (
      <div class:row on:click={() => setIndex(i)} >
        <strong>{i}</strong>
        <span>
          <em on:click={() => animal().count++}>{animal().count} {animal().name}{animal().count === 1 ? "" : "s"} </em>
          <em>in the {animal().habitat} {animal().count === 1 ? "is" : "are"} </em>
          <em>{animal().isEndangered ? "" : "not"} endangered</em>
        </span>
        <button on:click={() => removeAnimal(i)}>Remove</button>
        <button on:click={() => insertAnimal(i)}>Add</button>
      </div>
    )} />
    <button on:click={addAnimal}>Push</button>
    <button on:click={() => setAnimals.byRef((animals) => animals.sort((a, b) => a.count - b.count))}>Sort</button>
    <h1>You've clicked index #{index()}</h1>
  </main>,
);

function style() {
  return `
    :root, body, main {
      background: #222;
      color: #fff;
      font-size: 20px;
    }

    main {
      display: grid;
      gap: 0.2em;
      padding: 1rem;
    }

    button {
      font-size: 1rem;
    }

    .row {
      background: #111A;
      border: 1px solid #AAAA;
      display: grid;
      gap: 1em;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      padding: 0 1rem;
      user-select: none;
    }
  `;
}
