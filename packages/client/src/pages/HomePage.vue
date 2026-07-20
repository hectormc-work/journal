<script setup lang="ts">
import { Alert } from "@journal/ui-common";
import { computed, onMounted, ref } from "vue";

import { api, type Entry } from "../api";
import EntryDetail from "../components/EntryDetail.vue";
import EntrySidebar from "../components/EntrySidebar.vue";

const entries = ref<Entry[]>([]);
const selectedId = ref<string | null>(null);
const error = ref<string | null>(null);

async function loadEntries() {
  error.value = null;
  try {
    entries.value = await api.entry.list();
    if (entries.value.length > 0 && selectedId.value === null) {
      selectedId.value = entries.value[0]!.id;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(loadEntries);

// Writable computed so <EntryDetail v-model> can hand back an updated entry
// (e.g. after a save) and have it land back in the master list.
const selectedEntry = computed<Entry | null>({
  get: () => entries.value.find((e) => e.id === selectedId.value) ?? null,
  set: (updated) => {
    if (!updated) return;
    const index = entries.value.findIndex((e) => e.id === updated.id);
    if (index !== -1) entries.value[index] = updated;
  },
});

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

async function handleCreate() {
  error.value = null;
  try {
    const entry = await api.entry.create({ entry_date: todayIsoDate() });
    entries.value.unshift(entry);
    selectedId.value = entry.id;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

function handleDeleted() {
  entries.value = entries.value.filter((e) => e.id !== selectedId.value);
  selectedId.value = entries.value[0]?.id ?? null;
}

function handleError(message: string) {
  error.value = message;
}
</script>

<template>
  <div class="page">
    <Alert v-if="error">{{ error }}</Alert>
    <div class="app-shell">
      <EntrySidebar
        :entries="entries"
        :selected-id="selectedId"
        @select="(id) => (selectedId = id)"
        @create="handleCreate"
      />
      <EntryDetail
        v-if="selectedEntry"
        v-model="selectedEntry"
        @deleted="handleDeleted"
        @error="handleError"
      />
      <div v-else class="empty-state">
        <p>Select or create an entry.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.app-shell {
  display: flex;
  flex: 1;
  min-height: 0;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
}
</style>
