<script setup lang="ts">
import { Alert } from "@journal/ui-common";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { Entry } from "../api";
import EntryDetail from "../components/EntryDetail.vue";
import { useEntries } from "../composables/useEntries";

const route = useRoute();
const router = useRouter();
const { entries, loaded } = useEntries();
const error = ref<string | null>(null);

const entryId = computed(() => {
  const id = route.params.id;
  return Array.isArray(id) ? id[0] : id;
});

// Writable computed so <EntryDetail v-model> can hand back an updated entry
// (e.g. after a save) and have it land back in the shared list.
const entry = computed<Entry | null>({
  get: () => entries.value.find((e) => e.id === entryId.value) ?? null,
  set: (updated) => {
    if (!updated) return;
    const index = entries.value.findIndex((e) => e.id === updated.id);
    if (index !== -1) entries.value[index] = updated;
  },
});

function handleDeleted() {
  entries.value = entries.value.filter((e) => e.id !== entryId.value);
  const next = entries.value[0];
  router.push(next ? `/entries/${next.id}` : "/");
}

function handleError(message: string) {
  error.value = message;
}
</script>

<template>
  <div class="entry-page">
    <Alert v-if="error">{{ error }}</Alert>
    <EntryDetail
      v-if="entry"
      v-model="entry"
      @deleted="handleDeleted"
      @error="handleError"
    />
    <div v-else class="empty-state">
      <p>{{ loaded ? "Entry not found." : "Loading…" }}</p>
    </div>
  </div>
</template>

<style scoped>
.entry-page {
  display: flex;
  flex-direction: column;
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
