<script setup lang="ts">
import { Tabs } from "@journal/ui-common";
import { ref } from "vue";

import type { Entry } from "../api";
import EntryBodyEditor from "./EntryBodyEditor.vue";
import PromptsPanel from "./PromptsPanel.vue";
import TasksPanel from "./TasksPanel.vue";

const entry = defineModel<Entry>({ required: true });

const emit = defineEmits<{
  deleted: [];
  error: [message: string];
}>();

const activeTab = ref("questions");
// Bucket list tab added here once that branch lands.
const tabs = [
  { id: "questions", label: "Questions" },
  { id: "task", label: "Task" },
];
</script>

<template>
  <div class="entry-detail">
    <EntryBodyEditor
      v-model="entry"
      class="pane"
      @deleted="emit('deleted')"
      @error="(message) => emit('error', message)"
    />
    <Tabs v-model="activeTab" :tabs="tabs" class="pane">
      <template #questions>
        <PromptsPanel :entry-id="entry.id" />
      </template>
      <template #task>
        <TasksPanel :entry-id="entry.id" :entry-date="entry.entry_date" />
      </template>
    </Tabs>
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
