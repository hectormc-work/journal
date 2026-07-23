import { ref } from "vue";

import { api, type Task } from "../api";

// Module-level singleton (same pattern as useEntries) -- the standalone
// Todos page and an entry's embedded Task tab both need the same reactive
// task list, so a shared ref beats prop-drilling or duplicate fetches.
const tasks = ref<Task[]>([]);
const loaded = ref(false);

async function loadTasks() {
  tasks.value = await api.task.list();
  loaded.value = true;
}

async function createTask(text: string) {
  const created = await api.task.create({ text });
  tasks.value.push(created);
}

async function updateTask(
  id: string,
  body: Parameters<typeof api.task.update>[1],
) {
  const updated = await api.task.update(id, body);
  const index = tasks.value.findIndex((t) => t.id === id);
  if (index !== -1) tasks.value[index] = updated;
}

async function removeTask(id: string) {
  await api.task.remove(id);
  tasks.value = tasks.value.filter((t) => t.id !== id);
}

export function useTasks() {
  return { tasks, loaded, loadTasks, createTask, updateTask, removeTask };
}
