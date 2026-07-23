<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";

import { useEntries } from "../composables/useEntries";

const router = useRouter();
const { entries, loaded } = useEntries();

// Mirrors the old "auto-select the newest entry" behavior, just as a
// redirect instead of local selection state, now that viewing an entry is
// route-driven (/entries/:id).
watch(
  [entries, loaded],
  () => {
    const first = entries.value[0];
    if (loaded.value && first) router.replace(`/entries/${first.id}`);
  },
  { immediate: true },
);
</script>

<template>
  <div class="empty-state">
    <p>Create an entry to get started.</p>
  </div>
</template>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
}
</style>
