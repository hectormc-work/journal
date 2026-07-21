<script setup lang="ts">
// Attrs (blur/change/etc listeners) fall through to the native textarea.
defineProps<{ placeholder?: string }>();
const model = defineModel<string>({ required: true });
</script>

<template>
  <textarea
    v-model="model"
    class="text-area"
    :placeholder="placeholder"
  ></textarea>
</template>

<style scoped>
.text-area {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-serif);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text);
  padding: 1rem;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  outline: none;
  resize: none;
  background: var(--color-surface-raised);
}
.text-area:focus {
  border-color: var(--color-accent);
}
.text-area::placeholder {
  color: var(--color-text-muted);
}
</style>
