<script setup lang="ts">
import {
  Alert,
  Button,
  Clickable,
  Confirm,
  Icon,
  TextInput,
} from "@journal/ui-common";
import { Plus, Trash2, X } from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { api, type Prompt, type PromptGroup } from "../api";
import { useEntries } from "../composables/useEntries";

const router = useRouter();
const { entries } = useEntries();

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const entryDate = ref(todayIsoDate());
const entryName = ref("");
const error = ref<string | null>(null);
const submitting = ref(false);

const promptGroups = ref<PromptGroup[]>([]);
const prompts = ref<Prompt[]>([]);
const selectedGroupIds = ref(new Set<string>());
const newPromptTextByGroup = reactive<Record<string, string>>({});
const newGroupName = ref("");
const newGroupDescription = ref("");

// newPromptTextByGroup must have a "" entry per group before any TextInput
// binds to it -- v-model on an undefined key stringifies to "undefined" in
// the DOM the same way a null textarea value did in EntryBodyEditor.
async function loadPromptBank() {
  try {
    [promptGroups.value, prompts.value] = await Promise.all([
      api.promptGroup.list(),
      api.prompt.list(),
    ]);
    for (const group of promptGroups.value) {
      newPromptTextByGroup[group.id] = "";
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}
loadPromptBank();

const groupedPrompts = computed<Record<string, Prompt[]>>(() => {
  const map: Record<string, Prompt[]> = {};
  for (const prompt of prompts.value) {
    if (prompt.archived) continue;
    (map[prompt.group_id] ??= []).push(prompt);
  }
  for (const list of Object.values(map)) {
    list.sort((a, b) => a.position - b.position);
  }
  return map;
});

function toggleGroup(id: string) {
  if (selectedGroupIds.value.has(id)) {
    selectedGroupIds.value.delete(id);
  } else {
    selectedGroupIds.value.add(id);
  }
}

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) return;
  try {
    const group = await api.promptGroup.create({
      name,
      description: newGroupDescription.value.trim() || null,
    });
    promptGroups.value.push(group);
    newPromptTextByGroup[group.id] = "";
    newGroupName.value = "";
    newGroupDescription.value = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function deleteGroup(id: string) {
  try {
    await api.promptGroup.remove(id);
    promptGroups.value = promptGroups.value.filter((g) => g.id !== id);
    prompts.value = prompts.value.filter((p) => p.group_id !== id);
    selectedGroupIds.value.delete(id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function addPrompt(groupId: string) {
  const text = newPromptTextByGroup[groupId]?.trim();
  if (!text) return;
  try {
    const prompt = await api.prompt.create({ group_id: groupId, text });
    prompts.value.push(prompt);
    newPromptTextByGroup[groupId] = "";
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function removePrompt(id: string) {
  try {
    await api.prompt.remove(id);
    prompts.value = prompts.value.filter((p) => p.id !== id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
}

async function submit() {
  error.value = null;
  submitting.value = true;
  try {
    const entry = await api.entry.create({
      entry_date: entryDate.value,
      name: entryName.value.trim() || undefined,
    });
    for (const groupId of selectedGroupIds.value) {
      await api.entry.addPromptGroup(entry.id, { group_id: groupId });
    }
    entries.value.unshift(entry);
    router.push(`/entries/${entry.id}`);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    submitting.value = false;
  }
}

function cancel() {
  router.back();
}
</script>

<template>
  <div class="new-entry-page">
    <header class="page-header">
      <h1>New entry</h1>
      <div class="header-actions">
        <Button @click="cancel">Cancel</Button>
        <Button variant="accent" :disabled="submitting" @click="submit">
          Create entry
        </Button>
      </div>
    </header>

    <Alert v-if="error">{{ error }}</Alert>

    <section class="entry-fields">
      <TextInput
        v-model="entryName"
        variant="heading"
        placeholder="Title (defaults to the date)"
        class="entry-name"
      />
      <TextInput v-model="entryDate" type="date" class="entry-date" />
    </section>

    <section class="groups-section">
      <h2>Prompts</h2>
      <p class="section-note">Pick which prompt groups to answer today.</p>

      <div v-for="group in promptGroups" :key="group.id" class="group-card">
        <div class="group-header">
          <input
            type="checkbox"
            class="group-checkbox"
            :checked="selectedGroupIds.has(group.id)"
            @change="toggleGroup(group.id)"
          />
          <div class="group-title">
            <span class="group-name">{{ group.name }}</span>
            <span v-if="group.description" class="group-description">{{
              group.description
            }}</span>
          </div>
          <Confirm
            title="Delete this group?"
            :message="`Every prompt in &quot;${group.name}&quot; will be removed too.`"
            confirm-label="Delete"
            variant="danger"
          >
            <Clickable class="group-delete" @click="deleteGroup(group.id)">
              <Icon :icon="Trash2" :size="14" />
            </Clickable>
          </Confirm>
        </div>

        <ul
          v-if="(groupedPrompts[group.id] ?? []).length > 0"
          class="prompt-list"
        >
          <li v-for="prompt in groupedPrompts[group.id]" :key="prompt.id">
            <span>{{ prompt.text }}</span>
            <Clickable @click="removePrompt(prompt.id)">
              <Icon :icon="X" :size="14" />
            </Clickable>
          </li>
        </ul>

        <div class="add-prompt">
          <TextInput
            :model-value="newPromptTextByGroup[group.id] ?? ''"
            placeholder="Add a prompt..."
            @update:model-value="(v) => (newPromptTextByGroup[group.id] = v)"
            @keyup.enter="addPrompt(group.id)"
          />
          <Button @click="addPrompt(group.id)">
            <Icon :icon="Plus" :size="14" />
            Add
          </Button>
        </div>
      </div>

      <div class="new-group">
        <TextInput v-model="newGroupName" placeholder="New group name" />
        <TextInput
          v-model="newGroupDescription"
          placeholder="Description (optional)"
        />
        <Button variant="accent" @click="createGroup">
          <Icon :icon="Plus" />
          New group
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.new-entry-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: var(--color-text);
}
.new-entry-page > * {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.new-entry-page > :first-child {
  padding-top: 2rem;
}
.new-entry-page > :last-child {
  padding-bottom: 4rem;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 0.6rem;
}
.entry-fields {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.entry-name {
  flex: 1;
  min-width: 0;
}
.entry-date {
  flex-shrink: 0;
}
.groups-section h2 {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  margin: 0 0 0.25rem;
}
.section-note {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}
.group-card {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  padding: 1rem 1.1rem;
  margin-bottom: 1rem;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.group-checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
}
.group-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.group-name {
  font-weight: 600;
}
.group-description {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.group-delete {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.group-delete:hover {
  color: var(--color-danger);
}
.prompt-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.prompt-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.prompt-list li :deep(svg) {
  color: var(--color-text-muted);
}
.prompt-list li:hover :deep(svg) {
  color: var(--color-danger);
}
.add-prompt {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.add-prompt .text-input {
  flex: 1;
}
.new-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1.5rem;
}
.new-group > :first-child {
  flex: 1;
}
.new-group > :nth-child(2) {
  flex: 1;
}
</style>
