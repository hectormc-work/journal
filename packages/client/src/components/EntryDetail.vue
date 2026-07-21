<script setup lang="ts">
import type { Entry } from "../api";
import EntryBodyEditor from "./EntryBodyEditor.vue";
import PromptsPanel from "./PromptsPanel.vue";

const entry = defineModel<Entry>({ required: true });

const emit = defineEmits<{
  deleted: [];
  error: [message: string];
}>();
</script>

<template>
  <div class="entry-detail">
    <EntryBodyEditor
      v-model="entry"
      class="pane"
      @deleted="emit('deleted')"
      @error="(message) => emit('error', message)"
    />
    <PromptsPanel :entry-id="entry.id" class="pane" />
  </div>
</template>

<style scoped>
.entry-detail {
  display: flex;
  flex: 1;
  height: 100%;
  min-width: 0;
}
.pane {
  flex: 1 1 50%;
  width: 50%;
  min-width: 0;
}
</style>
