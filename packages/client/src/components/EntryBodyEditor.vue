<script setup lang="ts">
import { Button, Confirm, Icon, TextArea, TextInput } from "@journal/ui-common";
import { Download, Trash2 } from "lucide-vue-next";
import { computed } from "vue";

import { api, type Entry } from "../api";

const entry = defineModel<Entry>({ required: true });

const emit = defineEmits<{
  deleted: [];
  error: [message: string];
}>();

// entry.body is nullable in the DB (a fresh entry starts with body: null);
// the textarea always deals in strings, so empty stands in for null here.
const body = computed({
  get: () => entry.value.body ?? "",
  set: (value: string) => {
    entry.value.body = value;
  },
});

// Full replace (PUT) — always sends every field, whichever one triggered the save.
async function save() {
  try {
    entry.value = await api.entry.update(entry.value.id, {
      entry_date: entry.value.entry_date,
      name: entry.value.name,
      body: entry.value.body,
    });
  } catch (e) {
    emit("error", e instanceof Error ? e.message : String(e));
  }
}

async function remove() {
  try {
    await api.entry.remove(entry.value.id);
    emit("deleted");
  } catch (e) {
    emit("error", e instanceof Error ? e.message : String(e));
  }
}
</script>

<template>
  <section class="body-editor">
    <header>
      <TextInput
        v-model="entry.name"
        variant="heading"
        class="entry-name"
        @blur="save"
      />
      <TextInput
        v-model="entry.entry_date"
        type="date"
        class="entry-date"
        @change="save"
      />
      <Button
        as="a"
        :href="api.entry.exportUrl(entry.id)"
        download
        class="export-button"
      >
        <Icon :icon="Download" />
      </Button>
      <Confirm
        title="Delete this entry?"
        message="This can't be undone."
        confirm-label="Delete"
        variant="danger"
      >
        <Button variant="danger" class="delete-button" @click="remove">
          <Icon :icon="Trash2" />
        </Button>
      </Confirm>
    </header>
    <TextArea
      v-model="body"
      placeholder="Tell me about your day..."
      class="entry-body"
      @blur="save"
    />
  </section>
</template>

<style scoped>
.body-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.entry-name {
  flex: 1;
  min-width: 0;
}
.entry-date {
  flex-shrink: 0;
}
.export-button,
.delete-button {
  flex-shrink: 0;
}
.entry-body {
  flex: 1;
  min-height: 0;
}
</style>
