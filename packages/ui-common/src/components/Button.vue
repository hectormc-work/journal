<script setup lang="ts">
// Attrs (including click listeners) fall through to the native button.
withDefaults(defineProps<{ variant?: "default" | "accent" | "danger" }>(), {
  variant: "default",
});
</script>

<template>
  <button class="button" :class="variant" type="button">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-family: var(--font-sans);
  cursor: pointer;

  &:hover {
    border-color: var(--color-accent);
    color: var(--color-accent-strong);
  }

  &.accent {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-accent-ink);
    font-weight: 600;

    &:hover {
      background: var(--color-accent-hover);
      border-color: var(--color-accent-hover);
    }
  }

  &.danger {
    border-color: var(--color-danger);
    color: var(--color-danger);

    &:hover {
      background: var(--color-danger);
      color: var(--color-danger-ink);
    }
  }
}
</style>
