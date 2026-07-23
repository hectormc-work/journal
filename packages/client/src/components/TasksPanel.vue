<script setup lang="ts">
import {
  Alert,
  Button,
  Clickable,
  Confirm,
  Icon,
  TextInput,
} from "@journal/ui-common";
import { CalendarDays, Plus, Trash2 } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useEntries } from "../composables/useEntries";
import { useTasks } from "../composables/useTasks";

// Always embedded in an entry's panel -- checking a task off backdates it to
// entryDate instead of today, and the done list narrows to just this day.
const props = defineProps<{ entryId: string; entryDate: string }>();

const { tasks, loaded, loadTasks, createTask, updateTask, removeTask } =
  useTasks();
const { entries } = useEntries();
const router = useRouter();
const error = ref<string | null>(null);
const newTaskText = ref("");

onMounted(() => {
  if (!loaded.value) loadTasks().catch((e) => (error.value = String(e)));
});

const notDone = computed(() => tasks.value.filter((t) => !t.done_date));
// Only this entry's day -- other days' done tasks belong to their own entry.
const done = computed(() =>
  tasks.value.filter((t) => t.done_date === props.entryDate),
);

// The entry a done task's done_date implicitly links to, if that entry has
// been loaded (see useEntries) -- entries are one-per-day, so this is never
// ambiguous. No match (e.g. done today, no entry for today yet) -> no link.
function linkedEntry(doneDate: string) {
  return entries.value.find((e) => e.entry_date === doneDate);
}

async function toggle(id: string, next: boolean) {
  try {
    await updateTask(
      id,
      next ? { done: true, entry_date: props.entryDate } : { done: false },
    );
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function saveText(id: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    await updateTask(id, { text: trimmed });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function addTask() {
  const text = newTaskText.value.trim();
  if (!text) return;
  try {
    await createTask(text);
    newTaskText.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function remove(id: string) {
  try {
    await removeTask(id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <section class="tasks-panel">
    <Alert v-if="error">{{ error }}</Alert>
    <div class="task-list">
      <div v-if="done.length > 0" class="done-section">
        <div v-for="task in done" :key="task.id" class="task-item done">
          <input
            type="checkbox"
            class="task-checkbox"
            :checked="true"
            @change="toggle(task.id, false)"
          />
          <span class="task-text done-text">{{ task.text }}</span>
          <Clickable
            v-if="task.done_date && linkedEntry(task.done_date)"
            class="done-badge"
            @click="router.push(`/entries/${linkedEntry(task.done_date!)!.id}`)"
          >
            <Icon :icon="CalendarDays" :size="12" />
            {{ task.done_date }}
          </Clickable>
          <Confirm
            title="Delete this task?"
            confirm-label="Delete"
            variant="danger"
          >
            <Clickable class="task-delete" @click="remove(task.id)">
              <Icon :icon="Trash2" :size="14" />
            </Clickable>
          </Confirm>
        </div>
      </div>

      <div v-for="task in notDone" :key="task.id" class="task-item">
        <input
          type="checkbox"
          class="task-checkbox"
          :checked="false"
          @change="toggle(task.id, true)"
        />
        <TextInput
          v-model="task.text"
          class="task-text"
          @blur="saveText(task.id, task.text)"
        />
        <Confirm
          title="Delete this task?"
          confirm-label="Delete"
          variant="danger"
        >
          <Clickable class="task-delete" @click="remove(task.id)">
            <Icon :icon="Trash2" :size="14" />
          </Clickable>
        </Confirm>
      </div>

      <div class="new-task">
        <TextInput
          v-model="newTaskText"
          placeholder="Add a task..."
          @keyup.enter="addTask"
        />
        <Button @click="addTask">
          <Icon :icon="Plus" :size="14" />
          Add
        </Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tasks-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  box-sizing: border-box;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0;
}
.task-checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
}
.task-text {
  flex: 1;
  min-width: 0;
}
.done-text {
  color: var(--color-text-muted);
  text-decoration: line-through;
  font-size: 0.9rem;
}
.task-delete {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.task-delete:hover {
  color: var(--color-danger);
}
.done-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.done-badge:hover {
  color: var(--color-accent-strong);
}
.new-task {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.new-task .text-input {
  flex: 1;
}
.done-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-soft);
}
</style>
