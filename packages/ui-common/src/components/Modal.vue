<script setup lang="ts">
import { onUnmounted, watch } from "vue";

const open = defineModel<boolean>({ required: true });

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}

// Listener + body scroll lock only exist while the modal is actually open.
watch(
  open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
      window.addEventListener("keydown", onKeydown);
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="open = false">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 0.4);
  z-index: 100;
}
.modal-panel {
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  padding: 1.5rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.25);
  font-family: var(--font-sans);
}
</style>
