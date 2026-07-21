<script setup lang="ts">
// Attrs (including click listeners) fall through to the native <li>.
defineProps<{ active?: boolean }>();
</script>

<template>
  <li class="list-group-item" :class="{ active }">
    <slot />
  </li>
</template>

<style scoped lang="scss">
.list-group-item {
  padding: 0.5rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.875rem;

  &:hover {
    background: var(--color-surface-raised);
  }

  &.active {
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-weight: 600;
    box-shadow: inset 2px 0 0 var(--color-accent);
  }
}
</style>
