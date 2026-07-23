<script setup lang="ts">
// Attrs (blur/change/etc listeners) fall through to the native input.
withDefaults(
  defineProps<{ type?: "text" | "date"; variant?: "default" | "heading" }>(),
  { type: "text", variant: "default" },
);
const model = defineModel<string>({ required: true });
</script>

<template>
  <input v-model="model" class="text-input" :class="variant" :type="type" />
</template>

<style scoped lang="scss">
.text-input {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--color-text);
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);

  &:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  // An inline "editable heading" treatment — for fields like an entry's
  // title, which read as text rather than as a form control.
  &.heading {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border: none;
    border-bottom: 1px solid transparent;
    border-radius: 0;
    background: transparent;

    &:focus {
      border-bottom-color: var(--color-accent);
    }
  }
}
</style>
