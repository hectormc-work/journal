<script setup lang="ts">
import {
  Alert,
  Button,
  Clickable,
  Confirm,
  Icon,
  TextArea,
  TextInput,
} from "@journal/ui-common";
import { Plus, Trash2 } from "lucide-vue-next";
import { ref, watch } from "vue";

import { api } from "../api";

const props = defineProps<{ entryId: string }>();

// response is always a string here for editing -- normalized from the API's
// string | null (null = "unanswered") the same way EntryBodyEditor's body
// computed handles entry.body.
interface ResponseItem {
  id: string;
  prompt_text: string;
  response: string;
}

const responses = ref<ResponseItem[]>([]);
const error = ref<string | null>(null);
const newPromptText = ref("");

// Not just onMounted -- EntryDetail/PromptsPanel stay mounted across entry
// selection changes in the sidebar (HomePage only toggles v-if on whether
// something is selected, not on which entry), so entryId changes in place.
async function load() {
  error.value = null;
  try {
    const rows = await api.promptResponse.listForEntry(props.entryId);
    responses.value = rows.map((row) => ({
      id: row.id,
      prompt_text: row.prompt_text,
      response: row.response ?? "",
    }));
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}
watch(() => props.entryId, load, { immediate: true });

// Clearing a response back to blank reverts it to "unanswered" (null),
// rather than persisting an empty-string answer.
async function save(item: ResponseItem) {
  try {
    await api.promptResponse.update(item.id, {
      response: item.response.trim() === "" ? null : item.response,
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

// The always-present n+1th prompt -- a one-off, entry-specific prompt that
// isn't sourced from any prompt/prompt_group.
async function addPrompt() {
  const text = newPromptText.value.trim();
  if (!text) return;
  try {
    const created = await api.promptResponse.create(props.entryId, {
      prompt_text: text,
    });
    responses.value.push({
      id: created.id,
      prompt_text: created.prompt_text,
      response: created.response ?? "",
    });
    newPromptText.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function removePrompt(id: string) {
  try {
    await api.promptResponse.remove(id);
    responses.value = responses.value.filter((item) => item.id !== id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <section class="prompts-panel">
    <h2>Prompts</h2>
    <Alert v-if="error">{{ error }}</Alert>
    <div class="response-list">
      <div v-for="item in responses" :key="item.id" class="response-item">
        <div class="response-item-header">
          <p class="prompt-text">{{ item.prompt_text }}</p>
          <Confirm
            title="Remove this prompt?"
            message="Your response will be deleted too."
            confirm-label="Remove"
            variant="danger"
          >
            <Clickable class="response-delete" @click="removePrompt(item.id)">
              <Icon :icon="Trash2" :size="14" />
            </Clickable>
          </Confirm>
        </div>
        <TextArea
          v-model="item.response"
          placeholder="Your response..."
          class="response-input"
          @blur="save(item)"
        />
      </div>
      <div class="new-prompt">
        <TextInput
          v-model="newPromptText"
          placeholder="Add a prompt for this entry..."
          @keyup.enter="addPrompt"
        />
        <Button @click="addPrompt">
          <Icon :icon="Plus" :size="14" />
          Add
        </Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.prompts-panel {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  box-sizing: border-box;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
}
.prompts-panel h2 {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  margin: 0 0 1rem;
  color: var(--color-text);
}
.response-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.response-item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.prompt-text {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  margin: 0;
  color: var(--color-text);
}
.response-delete {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.response-delete:hover {
  color: var(--color-danger);
}
.response-input {
  min-height: 70px;
}
.new-prompt {
  display: flex;
  gap: 0.5rem;
}
.new-prompt .text-input {
  flex: 1;
}
</style>
