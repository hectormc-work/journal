<script setup lang="ts">
import { ref } from "vue";

import Button from "./Button.vue";
import Modal from "./Modal.vue";

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "accent" | "danger";
  }>(),
  {
    title: "Are you sure?",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
  },
);

const open = ref(false);
const triggerEl = ref<HTMLElement | null>(null);

// The first click on the slotted element is intercepted (capture phase, so
// it never reaches the slot's own listener) and opens the modal instead.
// Only a confirmed click gets synthetically replayed on it, so the slotted
// element keeps whatever @click handler it was written with.
let bypass = false;

function onTriggerClick(e: MouseEvent) {
  if (bypass) {
    bypass = false;
    return;
  }
  e.stopPropagation();
  e.preventDefault();
  open.value = true;
}

function confirm() {
  open.value = false;
  bypass = true;
  (triggerEl.value?.firstElementChild as HTMLElement | null)?.click();
}
</script>

<template>
  <span ref="triggerEl" class="confirm-trigger" @click.capture="onTriggerClick">
    <slot />
  </span>
  <Modal v-model="open">
    <h2 class="confirm-title">{{ title }}</h2>
    <p v-if="message" class="confirm-message">{{ message }}</p>
    <div class="confirm-actions">
      <Button @click="open = false">{{ cancelLabel }}</Button>
      <Button :variant="variant" @click="confirm">{{ confirmLabel }}</Button>
    </div>
  </Modal>
</template>

<style scoped>
.confirm-trigger {
  display: contents;
}
.confirm-title {
  font-family: var(--font-serif);
  font-size: 1.15rem;
  margin: 0 0 0.5rem;
  color: var(--color-text);
}
.confirm-message {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0 0 1.25rem;
}
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
</style>
